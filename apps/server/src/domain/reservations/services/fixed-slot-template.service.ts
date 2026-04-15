import { Context, Effect, Layer, Option } from "effect";

import type { StationRepo } from "@/domain/stations";

import { makeBikeRepository } from "@/domain/bikes";
import { makePricingPolicyRepository } from "@/domain/pricing";
import { defectOn } from "@/domain/shared";
import { makeStationRepository, StationRepository } from "@/domain/stations";
import {
  makeSubscriptionCommandRepository,
  makeSubscriptionQueryRepository,
} from "@/domain/subscriptions";
import { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { ReservationCommandRepo } from "../repository/reservation-command.repository";
import type { ReservationQueryRepo } from "../repository/reservation-query.repository";
import type { FixedSlotTemplateService } from "./fixed-slot-template/fixed-slot-template.types";

import {
  FixedSlotTemplateCancelConflict,
  FixedSlotTemplateConflict,
  FixedSlotTemplateDateLocked,
  FixedSlotTemplateDateNotFound,
  FixedSlotTemplateDateNotFuture,
  FixedSlotTemplateNotFound,
  FixedSlotTemplateStationNotFound,
} from "../domain-errors";
import { makeReservationCommandRepository, ReservationCommandRepository } from "../repository/reservation-command.repository";
import { makeReservationQueryRepository, ReservationQueryRepository } from "../repository/reservation-query.repository";
import { billFixedSlotDates } from "./fixed-slot-template/billing";
import {
  applyTemplateMutation,
  ensureTemplateMutationAllowed,
} from "./fixed-slot-template/mutations";
import {
  normalizeSlotDate,
  parseSlotDateKey,
  parseSlotTimeValue,
  toSlotDateKey,
} from "./fixed-slot/fixed-slot.helpers";

export type { FixedSlotTemplateService } from "./fixed-slot-template/fixed-slot-template.types";

/**
 * Tao service orchestration cho fixed-slot template.
 * Giu public API o day, day helper nho xuong folder con.
 *
 * @param deps Cac repo can de tao service.
 * @param deps.reservationQueryRepo Repo query cho template va reservation.
 * @param deps.reservationCommandRepo Repo command cho template va reservation.
 * @param deps.stationRepo Repo station o service scope.
 * @returns Service public de create/list/get/cancel/update/remove fixed-slot template.
 */
export function makeFixedSlotTemplateService(deps: {
  reservationQueryRepo: ReservationQueryRepo;
  reservationCommandRepo: ReservationCommandRepo;
  stationRepo: StationRepo;
}): FixedSlotTemplateService {
  return {
    createForUser: args =>
      Effect.gen(function* () {
        const { client } = yield* Prisma;
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

        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txStationRepo = makeStationRepository(tx);
            const txReservationQueryRepo = makeReservationQueryRepository(tx);
            const txReservationCommandRepo = makeReservationCommandRepository(tx);
            const txSubscriptionQueryRepo = makeSubscriptionQueryRepository(tx);
            const txSubscriptionCommandRepo = makeSubscriptionCommandRepository(tx);
            const txWalletRepo = makeWalletRepository(tx);
            const txPricingPolicyRepo = makePricingPolicyRepository(tx);

            const stationOpt = yield* txStationRepo.getById(args.stationId);
            if (Option.isNone(stationOpt)) {
              return yield* Effect.fail(new FixedSlotTemplateStationNotFound({
                stationId: args.stationId,
              }));
            }

            const conflictCount = yield* txReservationQueryRepo.countActiveFixedSlotTemplateConflicts(
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

            const billing = yield* billFixedSlotDates({
              userId: args.userId,
              totalSlots: slotDates.length,
              txPricingPolicyRepo,
              txSubscriptionQueryRepo,
              txSubscriptionCommandRepo,
              txWalletRepo,
            });

            return yield* txReservationCommandRepo.createFixedSlotTemplate({
              userId: args.userId,
              stationId: args.stationId,
              pricingPolicyId: billing.pricingPolicyId,
              subscriptionId: billing.subscriptionId,
              slotStart,
              prepaid: billing.prepaid,
              slotDates,
              updatedAt: now,
            });
          })).pipe(defectOn(PrismaTransactionError));
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

    cancelForUser: args =>
      Effect.gen(function* () {
        const { client } = yield* Prisma;
        const now = args.now ?? new Date();

        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txQueryRepo = makeReservationQueryRepository(tx);
            const txCommandRepo = makeReservationCommandRepository(tx);
            const bikeRepo = makeBikeRepository(tx);

            const templateOpt = yield* txQueryRepo.findFixedSlotTemplateByIdForUser(
              args.userId,
              args.templateId,
            );
            if (Option.isNone(templateOpt)) {
              return yield* Effect.fail(new FixedSlotTemplateNotFound({
                templateId: args.templateId,
              }));
            }

            const pendingReservations = yield* txQueryRepo.listPendingFixedSlotReservationsByTemplateId(
              args.templateId,
            );

            for (const reservation of pendingReservations) {
              yield* txCommandRepo.updateStatus({
                reservationId: reservation.id,
                status: "CANCELLED",
                updatedAt: now,
              }).pipe(
                Effect.catchTag("ReservationNotFound", () =>
                  Effect.fail(new FixedSlotTemplateCancelConflict({ templateId: args.templateId }))),
              );

              if (reservation.bikeId) {
                const released = yield* bikeRepo.releaseBikeIfReserved(reservation.bikeId, now);
                if (!released) {
                  return yield* Effect.fail(new FixedSlotTemplateCancelConflict({ templateId: args.templateId }));
                }
              }
            }

            if (templateOpt.value.status === "CANCELLED") {
              return templateOpt.value;
            }

            return yield* txCommandRepo.updateFixedSlotTemplateStatus({
              templateId: args.templateId,
              status: "CANCELLED",
              updatedAt: now,
            });
          }));
      }).pipe(defectOn(PrismaTransactionError)),

    updateForUser: args =>
      Effect.gen(function* () {
        const { client } = yield* Prisma;
        const now = args.now ?? new Date();
        const today = normalizeSlotDate(now);

        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txQueryRepo = makeReservationQueryRepository(tx);
            const txCommandRepo = makeReservationCommandRepository(tx);
            const bikeRepo = makeBikeRepository(tx);

            const templateOpt = yield* txQueryRepo.findFixedSlotTemplateByIdForUser(
              args.userId,
              args.templateId,
            );
            if (Option.isNone(templateOpt)) {
              return yield* Effect.fail(new FixedSlotTemplateNotFound({
                templateId: args.templateId,
              }));
            }

            const template = yield* ensureTemplateMutationAllowed(templateOpt.value, args.templateId);
            const currentDateKeySet = new Set(template.slotDates.map(toSlotDateKey));
            const lockedDateKeySet = new Set(
              template.slotDates
                .filter(slotDate => slotDate.getTime() <= today.getTime())
                .map(toSlotDateKey),
            );

            const nextSlotStart = args.slotStart ? parseSlotTimeValue(args.slotStart) : template.slotStart;
            let nextSlotDates = template.slotDates;

            if (args.slotDates) {
              nextSlotDates = args.slotDates.map(parseSlotDateKey);
              const nextDateKeySet = new Set(nextSlotDates.map(toSlotDateKey));

              for (const lockedDateKey of lockedDateKeySet) {
                if (!nextDateKeySet.has(lockedDateKey)) {
                  return yield* Effect.fail(new FixedSlotTemplateDateLocked({
                    slotDate: lockedDateKey,
                  }));
                }
              }

              for (const slotDate of nextSlotDates) {
                const slotDateKey = toSlotDateKey(slotDate);
                if (slotDate.getTime() <= today.getTime() && !currentDateKeySet.has(slotDateKey)) {
                  return yield* Effect.fail(new FixedSlotTemplateDateNotFuture({ slotDate: slotDateKey }));
                }
              }
            }

            return yield* applyTemplateMutation({
              userId: args.userId,
              template,
              templateId: args.templateId,
              nextSlotStart,
              nextSlotDates,
              now,
              tx,
              txQueryRepo,
              txCommandRepo,
              bikeRepo,
            });
          }));
      }).pipe(defectOn(PrismaTransactionError)),

    removeDateForUser: args =>
      Effect.gen(function* () {
        const { client } = yield* Prisma;
        const now = args.now ?? new Date();
        const today = normalizeSlotDate(now);
        const targetSlotDate = parseSlotDateKey(args.slotDate);
        const targetSlotDateKey = toSlotDateKey(targetSlotDate);

        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txQueryRepo = makeReservationQueryRepository(tx);
            const txCommandRepo = makeReservationCommandRepository(tx);
            const bikeRepo = makeBikeRepository(tx);

            const templateOpt = yield* txQueryRepo.findFixedSlotTemplateByIdForUser(
              args.userId,
              args.templateId,
            );
            if (Option.isNone(templateOpt)) {
              return yield* Effect.fail(new FixedSlotTemplateNotFound({
                templateId: args.templateId,
              }));
            }

            const template = yield* ensureTemplateMutationAllowed(templateOpt.value, args.templateId);
            const currentDateKeySet = new Set(template.slotDates.map(toSlotDateKey));
            if (!currentDateKeySet.has(targetSlotDateKey)) {
              return yield* Effect.fail(new FixedSlotTemplateDateNotFound({
                templateId: args.templateId,
                slotDate: targetSlotDateKey,
              }));
            }

            if (targetSlotDate.getTime() <= today.getTime()) {
              return yield* Effect.fail(new FixedSlotTemplateDateLocked({
                slotDate: targetSlotDateKey,
              }));
            }

            return yield* applyTemplateMutation({
              userId: args.userId,
              template,
              templateId: args.templateId,
              nextSlotStart: template.slotStart,
              nextSlotDates: template.slotDates.filter(slotDate => toSlotDateKey(slotDate) !== targetSlotDateKey),
              now,
              tx,
              txQueryRepo,
              txCommandRepo,
              bikeRepo,
            });
          }));
      }).pipe(defectOn(PrismaTransactionError)),
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
