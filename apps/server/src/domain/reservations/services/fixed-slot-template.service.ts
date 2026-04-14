import { Context, Effect, Layer, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";
import type {
  FixedSlotTemplateFilter,
  FixedSlotTemplateRow,
} from "@/domain/reservations/models";
import type { PageResult } from "@/domain/shared/pagination";
import type { StationRepo } from "@/domain/stations";

import { makeBikeRepository } from "@/domain/bikes";
import { getReservationFeeMinor, makePricingPolicyRepository } from "@/domain/pricing";
import { defectOn } from "@/domain/shared";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { makeStationRepository, StationRepository } from "@/domain/stations";
import { makeSubscriptionRepository } from "@/domain/subscriptions";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { ReservationCommandRepo } from "../repository/reservation-command.repository";
import type { ReservationQueryRepo } from "../repository/reservation-query.repository";

import {
  FixedSlotTemplateBillingConflict,
  FixedSlotTemplateCancelConflict,
  FixedSlotTemplateConflict,
  FixedSlotTemplateDateNotFuture,
  FixedSlotTemplateNotFound,
  FixedSlotTemplateStationNotFound,
} from "../domain-errors";
import { makeReservationCommandRepository, ReservationCommandRepository } from "../repository/reservation-command.repository";
import { makeReservationQueryRepository, ReservationQueryRepository } from "../repository/reservation-query.repository";
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
    | FixedSlotTemplateStationNotFound
    | FixedSlotTemplateDateNotFuture
    | FixedSlotTemplateConflict
    | FixedSlotTemplateBillingConflict
    | WalletNotFound
    | InsufficientWalletBalance,
    Prisma
  >;
  getByIdForUser: (args: {
    userId: string;
    templateId: string;
  }) => Effect.Effect<FixedSlotTemplateRow, FixedSlotTemplateNotFound>;
  listForUser: (args: {
    userId: string;
    filter: FixedSlotTemplateFilter;
    page?: number;
    pageSize?: number;
  }) => Effect.Effect<PageResult<FixedSlotTemplateRow>>;
  cancelForUser: (args: {
    userId: string;
    templateId: string;
    now?: Date;
  }) => Effect.Effect<
    FixedSlotTemplateRow,
    FixedSlotTemplateNotFound | FixedSlotTemplateCancelConflict,
    Prisma | BikeRepository
  >;
};

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
            const txSubscriptionRepo = makeSubscriptionRepository(tx);
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

            const pricingPolicy = yield* txPricingPolicyRepo.getActive().pipe(
              Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
              Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
            );
            const prepaidMinor = getReservationFeeMinor(pricingPolicy);
            const totalSlots = slotDates.length;

            let subscriptionId: string | null = null;
            let prepaid = toPrismaDecimal(prepaidMinor.toString());

            const currentSubscriptionOpt = yield* txSubscriptionRepo.findCurrentForUser(
              args.userId,
              ["ACTIVE", "PENDING"],
            );

            if (Option.isSome(currentSubscriptionOpt)) {
              const subscription = currentSubscriptionOpt.value;
              const remainingUsages = subscription.maxUsages === null
                ? null
                : subscription.maxUsages - subscription.usageCount;

              if (remainingUsages === null || remainingUsages >= totalSlots) {
                const incremented = yield* txSubscriptionRepo.incrementUsage(
                  subscription.id,
                  subscription.usageCount,
                  totalSlots,
                  ["ACTIVE", "PENDING"],
                );

                if (Option.isNone(incremented)) {
                  return yield* Effect.fail(new FixedSlotTemplateBillingConflict({ userId: args.userId }));
                }

                subscriptionId = subscription.id;
                prepaid = toPrismaDecimal("0");
              }
            }

            if (subscriptionId === null) {
              const totalPrepaidMinor = prepaidMinor * BigInt(totalSlots);

              yield* txWalletRepo.decreaseBalance({
                userId: args.userId,
                amount: totalPrepaidMinor,
                description: `Fixed-slot template upfront ${args.userId}`,
              }).pipe(
                Effect.catchTag("WalletRecordNotFound", () =>
                  Effect.fail(new WalletNotFound({ userId: args.userId }))),
                Effect.catchTag("WalletBalanceConstraint", ({ walletId, userId, balance, attemptedDebit }) =>
                  Effect.fail(new InsufficientWalletBalance({
                    walletId,
                    userId,
                    balance,
                    attemptedDebit,
                  }))),
              );
            }

            return yield* txReservationCommandRepo.createFixedSlotTemplate({
              userId: args.userId,
              stationId: args.stationId,
              pricingPolicyId: pricingPolicy.id,
              subscriptionId,
              slotStart,
              prepaid,
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
