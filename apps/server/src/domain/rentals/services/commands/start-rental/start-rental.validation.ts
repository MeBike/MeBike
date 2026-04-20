import { Effect, Option } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { getDepositRequiredMinor, makePricingPolicyRepository } from "@/domain/pricing";
import {
  isWithinOvernightOperationsWindow,
  makeOvernightOperationsClosedError,
} from "@/domain/shared";

import type { RentalServiceFailure } from "../../../domain-errors";
import type { StartRentalInput } from "../../../types";
import type { PreparedStartRental } from "./start-rental.types";

import {
  ActiveRentalExists,
  BikeAlreadyRented,
  BikeMissingStation,
  BikeNotFound,
  BikeNotFoundInStation,
} from "../../../domain-errors";
import { startRentalFailureFromBikeStatus } from "../../../guards/bike-status";
import { makeRentalRepository } from "../../../repository/rental.repository";

/**
 * Chạy toàn bộ bước kiểm tra trước khi bắt đầu thuê xe.
 *
 * Hàm này chỉ đọc và diễn giải trạng thái nghiệp vụ,
 * chưa ghi bất kỳ side effect nào xuống database.
 */
export function prepareStartRentalInTx(
  tx: PrismaTypes.TransactionClient,
  input: StartRentalInput,
): Effect.Effect<PreparedStartRental, RentalServiceFailure> {
  return Effect.gen(function* () {
    const txBikeRepo = makeBikeRepository(tx);
    const txRentalRepo = makeRentalRepository(tx);
    const txPricingPolicyRepo = makePricingPolicyRepository(tx);
    const now = input.now ?? new Date();

    if (isWithinOvernightOperationsWindow(now)) {
      return yield* Effect.fail(makeOvernightOperationsClosedError(now));
    }

    const existingByUser = yield* txRentalRepo.findActiveByUserId(input.userId);
    if (Option.isSome(existingByUser)) {
      return yield* Effect.fail(new ActiveRentalExists({ userId: input.userId }));
    }

    const existingByBike = yield* txRentalRepo.findActiveByBikeId(input.bikeId);
    if (Option.isSome(existingByBike)) {
      return yield* Effect.fail(new BikeAlreadyRented({ bikeId: input.bikeId }));
    }

    const bikeOpt = yield* txBikeRepo.getById(input.bikeId);
    if (Option.isNone(bikeOpt)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId: input.bikeId }));
    }

    const bike = bikeOpt.value;
    if (!bike.stationId) {
      return yield* Effect.fail(new BikeMissingStation({ bikeId: input.bikeId }));
    }
    if (bike.stationId !== input.startStationId) {
      return yield* Effect.fail(new BikeNotFoundInStation({
        bikeId: input.bikeId,
        stationId: input.startStationId,
      }));
    }

    const bikeStatusFailure = startRentalFailureFromBikeStatus({
      bikeId: input.bikeId,
      status: bike.status,
    });
    if (Option.isSome(bikeStatusFailure)) {
      return yield* Effect.fail(bikeStatusFailure.value);
    }

    const pricingPolicy = yield* txPricingPolicyRepo.getActive().pipe(
      Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
      Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
    );

    return {
      pricingPolicyId: pricingPolicy.id,
      requiredBalance: getDepositRequiredMinor(pricingPolicy),
    };
  });
}
