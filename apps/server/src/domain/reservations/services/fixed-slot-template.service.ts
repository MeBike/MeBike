import { Context, Effect, Layer, Option } from "effect";

import type {
  FixedSlotTemplateFilter,
  FixedSlotTemplateRow,
} from "@/domain/reservations/models";
import type { PageResult } from "@/domain/shared/pagination";
import type { StationRepo } from "@/domain/stations";

import { StationRepository } from "@/domain/stations";

import type { ReservationCommandRepo } from "../repository/reservation-command.repository";
import type { ReservationQueryRepo } from "../repository/reservation-query.repository";

import {
  FixedSlotTemplateConflict,
  FixedSlotTemplateDateNotFuture,
  FixedSlotTemplateStationNotFound,
} from "../domain-errors";
import { ReservationCommandRepository } from "../repository/reservation-command.repository";
import { ReservationQueryRepository } from "../repository/reservation-query.repository";
import {
  normalizeSlotDate,
  parseSlotDateKey,
  parseSlotTimeValue,
  toSlotDateKey,
} from "./fixed-slot/fixed-slot.helpers";

export type FixedSlotTemplateService = {
  createForUser: (args: {
    userId: string;
    stationId: string;
    slotStart: string;
    slotDates: ReadonlyArray<string>;
    now?: Date;
  }) => Effect.Effect<
    FixedSlotTemplateRow,
    FixedSlotTemplateStationNotFound | FixedSlotTemplateDateNotFuture | FixedSlotTemplateConflict
  >;
  listForUser: (args: {
    userId: string;
    filter: FixedSlotTemplateFilter;
    page?: number;
    pageSize?: number;
  }) => Effect.Effect<PageResult<FixedSlotTemplateRow>>;
};

export function makeFixedSlotTemplateService(deps: {
  reservationQueryRepo: ReservationQueryRepo;
  reservationCommandRepo: ReservationCommandRepo;
  stationRepo: StationRepo;
}): FixedSlotTemplateService {
  return {
    createForUser: args =>
      Effect.gen(function* () {
        const now = args.now ?? new Date();
        const today = normalizeSlotDate(now);
        const slotStart = parseSlotTimeValue(args.slotStart);
        const slotDates = args.slotDates.map(parseSlotDateKey);

        for (const slotDate of slotDates) {
          if (slotDate.getTime() <= today.getTime()) {
            return yield* Effect.fail(new FixedSlotTemplateDateNotFuture({
              slotDate: toSlotDateKey(slotDate),
            }));
          }
        }

        const stationOpt = yield* deps.stationRepo.getById(args.stationId);
        if (Option.isNone(stationOpt)) {
          return yield* Effect.fail(new FixedSlotTemplateStationNotFound({
            stationId: args.stationId,
          }));
        }

        const conflictCount = yield* deps.reservationQueryRepo.countActiveFixedSlotTemplateConflicts(
          args.userId,
          slotStart,
          slotDates,
        );
        if (conflictCount > 0) {
          return yield* Effect.fail(new FixedSlotTemplateConflict({
            userId: args.userId,
            slotStart: args.slotStart,
            slotDates: [...args.slotDates],
          }));
        }

        return yield* deps.reservationCommandRepo.createFixedSlotTemplate({
          userId: args.userId,
          stationId: args.stationId,
          slotStart,
          slotDates,
          updatedAt: now,
        });
      }),

    listForUser: args =>
      deps.reservationQueryRepo.listFixedSlotTemplatesForUser(
        args.userId,
        args.filter,
        {
          page: args.page ?? 1,
          pageSize: args.pageSize ?? 20,
          sortBy: "updatedAt",
          sortDir: "desc",
        },
      ),
  };
}

export class FixedSlotTemplateServiceTag extends Context.Tag("FixedSlotTemplateService")<
  FixedSlotTemplateServiceTag,
  FixedSlotTemplateService
>() {}

export const FixedSlotTemplateServiceLive = Layer.effect(
  FixedSlotTemplateServiceTag,
  Effect.gen(function* () {
    const reservationQueryRepo = yield* ReservationQueryRepository;
    const reservationCommandRepo = yield* ReservationCommandRepository;
    const stationRepo = yield* StationRepository;

    return makeFixedSlotTemplateService({
      reservationQueryRepo,
      reservationCommandRepo,
      stationRepo,
    });
  }),
);
