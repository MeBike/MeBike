import { Effect, Option } from "effect";

import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { makeWalletRepository } from "@/domain/wallets";

import type { RentalServiceFailure } from "../../../domain-errors";
import type { RentalRow } from "../../../models";
import type {
  FinalizeRentalReturnInput,
  FinalizeRentalReturnPricing,
} from "./finalize-rental-return.types";

import {
  BikeNotFound,
  InsufficientBalanceToRent,
  UserWalletNotFound,
} from "../../../domain-errors";
import { makeRentalRepository } from "../../../repository/rental.repository";
import { makeReturnSlotRepository } from "../../../repository/return-slot.repository";
import {
  forfeitRentalDepositHoldInTx,
  releaseRentalDepositHoldInTx,
} from "../rental-deposit-hold.service";

/**
 * Ghi các side effect còn lại sau khi đã tính xong pricing cho lượt trả xe.
 *
 * Bao gồm xử lý cọc, trừ ví, cập nhật xe, đóng return slot,
 * hoàn tất rental và tạo billing record.
 */
export function persistFinalizeRentalReturnInTx(args: {
  readonly input: FinalizeRentalReturnInput;
  readonly pricing: FinalizeRentalReturnPricing;
}): Effect.Effect<RentalRow, RentalServiceFailure> {
  return Effect.gen(function* () {
    const {
      input: { tx, rental, bikeId, endStationId, endTime },
      pricing,
    } = args;
    const txBikeRepo = makeBikeRepository(tx);
    const txRentalRepo = makeRentalRepository(tx);
    const txReturnSlotRepo = makeReturnSlotRepository(tx);

    yield* handleRentalDepositOnReturnInTx({
      tx,
      rental,
      endTime,
      depositForfeited: pricing.depositForfeited,
    });

    if (pricing.totalPriceMinor > 0n) {
      yield* debitWallet(makeWalletRepository(tx), {
        userId: rental.userId,
        amount: pricing.totalPriceMinor,
        description: `Rental ${rental.id}`,
        hash: `rental:${rental.id}`,
        type: "DEBIT",
      });
    }

    const updatedBike = yield* txBikeRepo.updateStatusAndStationAt(
      bikeId,
      "AVAILABLE",
      endStationId,
      endTime,
    );
    if (Option.isNone(updatedBike)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId }));
    }

    yield* txReturnSlotRepo.finalizeActiveByRentalId(
      rental.id,
      "USED",
      endTime,
    );

    const updatedRental = yield* txRentalRepo.updateRentalOnEnd({
      rentalId: rental.id,
      pricingPolicyId: pricing.pricingPolicy.id,
      endStationId,
      endTime,
      durationMinutes: pricing.durationMinutes,
      totalPrice: Number(pricing.totalPriceMinor),
      newStatus: "COMPLETED",
    });

    if (Option.isNone(updatedRental)) {
      return yield* Effect.die(new Error(
        `Expected rental ${rental.id} to remain completable during return finalization`,
      ));
    }

    yield* createRentalBillingRecordInTx({
      tx,
      rental,
      pricing,
    });

    return updatedRental.value;
  });
}

/**
 * Đóng cọc theo đúng nghiệp vụ của lượt trả: hoàn cọc hoặc mất cọc.
 */
function handleRentalDepositOnReturnInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly rental: RentalRow;
  readonly endTime: Date;
  readonly depositForfeited: boolean;
}): Effect.Effect<void> {
  return Effect.gen(function* () {
    const { tx, rental, endTime, depositForfeited } = args;

    if (!rental.depositHoldId) {
      return;
    }

    const depositHandled = depositForfeited
      ? yield* forfeitRentalDepositHoldInTx({
        tx,
        holdId: rental.depositHoldId,
        userId: rental.userId,
        rentalId: rental.id,
        forfeitedAt: endTime,
      }).pipe(
        Effect.catchTag("WalletNotFound", err => Effect.die(err)),
        Effect.catchTag("InsufficientWalletBalance", err => Effect.die(err)),
      )
      : yield* releaseRentalDepositHoldInTx({
        tx,
        holdId: rental.depositHoldId,
        releasedAt: endTime,
      });

    if (!depositHandled) {
      return yield* Effect.die(new Error(
        `Expected rental ${rental.id} deposit hold ${rental.depositHoldId} to be handled during return finalization`,
      ));
    }
  });
}

/**
 * Tạo billing record cuối cùng sau khi rental đã đủ dữ liệu giá và giảm trừ.
 */
function createRentalBillingRecordInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly rental: RentalRow;
  readonly pricing: FinalizeRentalReturnPricing;
}): Effect.Effect<void> {
  return Effect.tryPromise({
    try: () =>
      args.tx.rentalBillingRecord.create({
        data: {
          rentalId: args.rental.id,
          pricingPolicyId: args.pricing.pricingPolicy.id,
          totalDurationMinutes: args.pricing.durationMinutes,
          estimatedDistanceKm: null,
          baseAmount: toPrismaDecimal(args.pricing.fullBaseAmountMinor.toString()),
          couponRuleId: args.pricing.selectedCouponRule?.ruleId ?? null,
          ...(args.pricing.couponRuleSnapshot
            ? {
                couponRuleSnapshot: args.pricing.couponRuleSnapshot as unknown as PrismaTypes.InputJsonValue,
              }
            : {}),
          couponDiscountAmount: toPrismaDecimal(args.pricing.couponDiscountAmountMinor.toString()),
          subscriptionDiscountAmount: toPrismaDecimal(args.pricing.subscriptionDiscountMinor.toString()),
          depositForfeited: args.pricing.depositForfeited,
          totalAmount: toPrismaDecimal(args.pricing.totalPriceMinor.toString()),
        },
      }),
    catch: err => err,
  }).pipe(
    Effect.catchAll(err => Effect.die(err)),
    Effect.asVoid,
  );
}

/**
 * Trừ tiền thuê cuối cùng khỏi ví người dùng và map lỗi về domain error của rental.
 */
function debitWallet(
  repo: ReturnType<typeof makeWalletRepository>,
  input: DecreaseBalanceInput,
) {
  return repo.decreaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new UserWalletNotFound({ userId: input.userId }))),
    Effect.catchTag("WalletBalanceConstraint", (err: WalletBalanceConstraint) =>
      Effect.fail(new InsufficientBalanceToRent({
        userId: err.userId,
        requiredBalance: Number(err.attemptedDebit),
        currentBalance: Number(err.balance),
      }))),
  );
}
