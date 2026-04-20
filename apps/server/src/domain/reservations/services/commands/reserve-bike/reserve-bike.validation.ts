import { Effect, Option } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { env } from "@/config/env";
import { makeBikeRepository } from "@/domain/bikes";
import { getReservationFeeMinor, makePricingPolicyRepository } from "@/domain/pricing";
import {
  isWithinOvernightOperationsWindow,
  makeOvernightOperationsClosedError,
} from "@/domain/shared";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { makeStationQueryRepository } from "@/domain/stations";

import type { PreparedReserveBike, ReserveBikeCommandInput, ReserveBikeFailure } from "./reserve-bike.types";

import {
  ActiveReservationExists,
  BikeAlreadyReserved,
  BikeNotAvailable,
  BikeNotFound,
  BikeNotFoundInStation,
  ReservationOptionNotSupported,
  StationReservationAvailabilityTooLow,
  SubscriptionRequired,
} from "../../../domain-errors";
import { makeReservationQueryRepository } from "../../../repository/reservation-query.repository";
import {
  lockStationForReservationCheck,
  requiredAvailableBikesForReservation,
  stationCanAcceptReservation,
} from "../../reservation-availability-rule";

const HOLD_MINUTES = env.RESERVATION_HOLD_MINUTES;

function computeEndTime(startTime: Date, holdMinutes = HOLD_MINUTES): Date {
  return new Date(startTime.getTime() + holdMinutes * 60 * 1000);
}

/**
 * Chạy toàn bộ bước kiểm tra read-only trước khi tạo reservation hold.
 *
 * Hàm này cố tình không ghi side effect nào xuống DB.
 * Mục tiêu là gom toàn bộ rule đọc trạng thái vào một nơi, để bước persistence
 * phía sau chỉ còn lo mutation và outbox/email.
 */
export function prepareReserveBikeInTx(
  tx: PrismaTypes.TransactionClient,
  input: ReserveBikeCommandInput,
): Effect.Effect<PreparedReserveBike, ReserveBikeFailure> {
  return Effect.gen(function* () {
    const txBikeRepo = makeBikeRepository(tx);
    const txStationRepo = makeStationQueryRepository(tx);
    const txReservationQueryRepo = makeReservationQueryRepository(tx);
    const txPricingPolicyRepo = makePricingPolicyRepository(tx);

    if (isWithinOvernightOperationsWindow(input.now)) {
      return yield* Effect.fail(makeOvernightOperationsClosedError(input.now));
    }

    if (input.reservationOption === "FIXED_SLOT") {
      return yield* Effect.fail(
        new ReservationOptionNotSupported({ option: input.reservationOption }),
      );
    }

    const existingByUser = yield* txReservationQueryRepo.findPendingHoldByUserIdNow(
      input.userId,
      input.now,
    );
    if (Option.isSome(existingByUser)) {
      return yield* Effect.fail(new ActiveReservationExists({ userId: input.userId }));
    }

    const activeReservation = yield* txReservationQueryRepo.findLatestPendingOrActiveByUserId(
      input.userId,
    );
    if (Option.isSome(activeReservation)) {
      return yield* Effect.fail(new ActiveReservationExists({ userId: input.userId }));
    }

    const existingByBike = yield* txReservationQueryRepo.findPendingHoldByBikeIdNow(
      input.bikeId,
      input.now,
    );
    if (Option.isSome(existingByBike)) {
      return yield* Effect.fail(new BikeAlreadyReserved({ bikeId: input.bikeId }));
    }

    const bikeOpt = yield* txBikeRepo.getById(input.bikeId);
    if (Option.isNone(bikeOpt)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId: input.bikeId }));
    }

    const bike = bikeOpt.value;
    if (!bike.stationId || bike.stationId !== input.stationId) {
      return yield* Effect.fail(new BikeNotFoundInStation({
        bikeId: input.bikeId,
        stationId: input.stationId,
      }));
    }

    if (bike.status !== "AVAILABLE") {
      return yield* Effect.fail(new BikeNotAvailable({
        bikeId: input.bikeId,
        status: bike.status,
      }));
    }

    const stationOpt = yield* txStationRepo.getById(input.stationId);
    if (Option.isNone(stationOpt)) {
      return yield* Effect.die(new Error(
        `Invariant violated: bike ${input.bikeId} references missing station ${input.stationId}`,
      ));
    }

    yield* lockStationForReservationCheck(tx, input.stationId);

    const availableBikes = yield* txBikeRepo.countAvailableByStation(input.stationId);
    const requiredAvailableBikes = requiredAvailableBikesForReservation(
      stationOpt.value.totalCapacity,
    );

    if (!stationCanAcceptReservation({
      totalCapacity: stationOpt.value.totalCapacity,
      availableBikes,
    })) {
      return yield* Effect.fail(new StationReservationAvailabilityTooLow({
        stationId: input.stationId,
        totalCapacity: stationOpt.value.totalCapacity,
        availableBikes,
        requiredAvailableBikes,
      }));
    }

    const pricingPolicy = yield* txPricingPolicyRepo.getActive().pipe(
      Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
      Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
    );

    if (input.reservationOption === "SUBSCRIPTION" && !input.subscriptionId) {
      return yield* Effect.fail(new SubscriptionRequired({ userId: input.userId }));
    }

    const prepaidMinor = input.reservationOption === "SUBSCRIPTION"
      ? 0n
      : getReservationFeeMinor(pricingPolicy);

    return {
      endTime: input.endTime ?? computeEndTime(input.startTime),
      pricingPolicyId: pricingPolicy.id,
      prepaidMinor,
      prepaid: toPrismaDecimal(prepaidMinor.toString()),
      subscriptionId: input.subscriptionId ?? null,
    };
  });
}
