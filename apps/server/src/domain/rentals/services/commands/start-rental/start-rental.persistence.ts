import { Effect, Option } from "effect";

import type { SubscriptionCommandService } from "@/domain/subscriptions/services/subscription.service.types";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";

import type { RentalServiceFailure } from "../../../domain-errors";
import type { RentalRow } from "../../../models";
import type { StartRentalInput } from "../../../types";
import type { PreparedStartRental } from "./start-rental.types";

import {
  BikeAlreadyRented,
  BikeNotFound,
  InsufficientBalanceToRent,
  UserWalletNotFound,
} from "../../../domain-errors";
import { startRentalFailureFromBikeStatus } from "../../../guards/bike-status";
import { makeRentalRepository } from "../../../repository/rental.repository";
import { rentalUniqueViolationToFailure } from "../../shared/unique-violation-mapper";
import { createRentalDepositHoldInTx } from "../rental-deposit-hold.service";

/**
 * Ghi toàn bộ side effect để bắt đầu một lượt thuê mới.
 *
 * Phần validation đọc-only đã được chạy trước đó;
 * file này chỉ xử lý các bước ghi dữ liệu, giữ chỗ xe và giữ cọc.
 */
export function persistStartRentalInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly input: StartRentalInput;
  readonly prepared: PreparedStartRental;
  readonly subscriptionCommandService: SubscriptionCommandService;
}): Effect.Effect<RentalRow, RentalServiceFailure> {
  return Effect.gen(function* () {
    const { tx, input, prepared, subscriptionCommandService } = args;
    const txRentalRepo = makeRentalRepository(tx);

    if (input.subscriptionId) {
      yield* subscriptionCommandService.useOne(tx, {
        subscriptionId: input.subscriptionId,
        userId: input.userId,
        now: input.startTime,
      });
    }

    yield* bookBikeForRentalInTx(tx, input.bikeId, input.startTime);

    const created = yield* txRentalRepo.createRental({
      userId: input.userId,
      bikeId: input.bikeId,
      pricingPolicyId: prepared.pricingPolicyId,
      startStationId: input.startStationId,
      startTime: input.startTime,
      subscriptionId: input.subscriptionId ?? null,
    }).pipe(
      Effect.catchTag(
        "RentalUniqueViolation",
        ({ constraint }): Effect.Effect<never, RentalServiceFailure> => {
          const mapped = rentalUniqueViolationToFailure({
            constraint,
            bikeId: input.bikeId,
            userId: input.userId,
          });
          if (Option.isSome(mapped)) {
            return Effect.fail(mapped.value);
          }

          return Effect.die(new Error(
            `Unhandled rental unique constraint: ${String(constraint)}`,
          ));
        },
      ),
    );

    yield* createRentalDepositHoldInTx({
      tx,
      rentalId: created.id,
      userId: input.userId,
      amount: prepared.requiredBalance,
    }).pipe(
      Effect.catchTag("WalletNotFound", () =>
        Effect.fail(new UserWalletNotFound({ userId: input.userId }))),
      Effect.catchTag("InsufficientWalletBalance", ({ balance, attemptedDebit }) =>
        Effect.fail(new InsufficientBalanceToRent({
          userId: input.userId,
          requiredBalance: Number(attemptedDebit),
          currentBalance: Number(balance),
        }))),
    );

    const rentalWithDepositHoldOpt = yield* txRentalRepo.findById(created.id);
    if (Option.isNone(rentalWithDepositHoldOpt)) {
      return yield* Effect.die(new Error(`Expected rental ${created.id} after deposit hold creation`));
    }

    return rentalWithDepositHoldOpt.value;
  });
}

/**
 * Thử giữ xe để bắt đầu rental và chuyển các race condition phổ biến về lỗi domain rõ ràng.
 */
function bookBikeForRentalInTx(
  tx: PrismaTypes.TransactionClient,
  bikeId: string,
  startTime: Date,
): Effect.Effect<void, RentalServiceFailure> {
  return Effect.gen(function* () {
    const txBikeRepo = makeBikeRepository(tx);

    const booked = yield* txBikeRepo.bookBikeIfAvailable(bikeId, startTime);
    if (booked) {
      return;
    }

    const latestBike = yield* txBikeRepo.getById(bikeId);
    if (Option.isNone(latestBike)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId }));
    }

    const failure = startRentalFailureFromBikeStatus({
      bikeId,
      status: latestBike.value.status,
    });
    if (Option.isSome(failure)) {
      return yield* Effect.fail(failure.value);
    }

    return yield* Effect.fail(new BikeAlreadyRented({ bikeId }));
  });
}
