import { Context, Effect, Layer, Option } from "effect";

import type { ReservationQueryRepo } from "../repository/reservation-query.repository";
import type { FixedSlotTemplateService } from "./fixed-slot-template/fixed-slot-template.types";

import {
  FixedSlotTemplateNotFound,
} from "../domain-errors";
import { ReservationQueryRepository } from "../repository/reservation-query.repository";
import { cancelFixedSlotTemplateForUser } from "./fixed-slot-template/fixed-slot-template.cancel";
import { createFixedSlotTemplateForUser } from "./fixed-slot-template/fixed-slot-template.create";
import {
  removeFixedSlotTemplateDateForUser,
  updateFixedSlotTemplateForUser,
} from "./fixed-slot-template/fixed-slot-template.update";

export type { FixedSlotTemplateService } from "./fixed-slot-template/fixed-slot-template.types";

/**
 * Tao service orchestration cho fixed-slot template.
 * Giu public API o day, day helper nho xuong folder con.
 *
 * @param deps Cac repo can de tao service.
 * @param deps.reservationQueryRepo Repo query cho template va reservation.
 * @returns Service public de create/list/get/cancel/update/remove fixed-slot template.
 */
export function makeFixedSlotTemplateService(deps: {
  reservationQueryRepo: ReservationQueryRepo;
}): FixedSlotTemplateService {
  return {
    createForUser: createFixedSlotTemplateForUser,

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

    getByIdForUser: args =>
      Effect.gen(function* () {
        const templateOpt = yield* deps.reservationQueryRepo.findFixedSlotTemplateByIdForUser(
          args.userId,
          args.templateId,
        );

        if (Option.isNone(templateOpt)) {
          return yield* Effect.fail(new FixedSlotTemplateNotFound({
            templateId: args.templateId,
          }));
        }

        return templateOpt.value;
      }),

    cancelForUser: cancelFixedSlotTemplateForUser,

    updateForUser: updateFixedSlotTemplateForUser,

    removeDateForUser: removeFixedSlotTemplateDateForUser,
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

    return makeFixedSlotTemplateService({
      reservationQueryRepo,
    });
  }),
);
