import { Effect, Match } from "effect";

import { defectOn } from "@/domain/shared";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { IncreaseBalanceInput } from "../../models";
import type { StripeWebhookOutcome } from "../providers/stripe-topup.service";

import { TopupProviderError, WalletNotFound as WalletNotFoundError } from "../../domain-errors";
import { makePaymentAttemptRepository } from "../../repository/payment-attempt.repository";
import { makeWalletCommandRepository } from "../../repository/wallet-command.repository";
import { makeWalletQueryRepository } from "../../repository/wallet-query.repository";

/**
 * Credit wallet trong transaction settle top-up và xử lý idempotency ledger.
 *
 * Nếu ledger hash đã tồn tại, đọc lại wallet hiện tại thay vì credit lần hai.
 *
 * @param commandRepo Wallet command repo đang bám theo transaction hiện tại.
 * @param queryRepo Wallet query repo đang bám theo transaction hiện tại.
 * @param input Dữ liệu credit wallet.
 * @param input.userId ID user được credit.
 * @param input.amount Số tiền top-up theo minor unit.
 * @param input.description Mô tả transaction wallet.
 * @param input.hash Khóa idempotency của ledger entry.
 * @param input.type Loại transaction wallet cần ghi.
 */
function creditWallet(
  commandRepo: ReturnType<typeof makeWalletCommandRepository>,
  queryRepo: ReturnType<typeof makeWalletQueryRepository>,
  input: IncreaseBalanceInput,
) {
  return commandRepo.increaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new WalletNotFoundError({ userId: input.userId }))),
    Effect.catchTag("WalletUniqueViolation", () =>
      queryRepo.findByUserId(input.userId).pipe(
        Effect.flatMap(maybeWallet =>
          maybeWallet._tag === "Some"
            ? Effect.succeed(maybeWallet.value)
            : Effect.fail(new WalletNotFoundError({ userId: input.userId }))),
      )),
  );
}

/**
 * Settle một top-up Stripe đã được xác nhận thành công.
 *
 * Hàm này là điểm dùng chung cho webhook và reconciliation:
 * - mark payment attempt từ `PENDING` sang `SUCCEEDED`
 * - credit wallet trong cùng transaction DB
 * - bỏ qua nếu attempt đã được xử lý trước đó
 *
 * @param client Prisma client root dùng để mở transaction settle.
 * @param attempt Payment attempt nội bộ cần settle.
 * @param attempt.id ID payment attempt.
 * @param attempt.userId ID user sở hữu attempt.
 * @param attempt.currency Currency nội bộ của attempt.
 * @param input Dữ liệu provider đã xác nhận.
 * @param input.providerRef Stripe provider reference dùng để settle attempt.
 * @param input.amountMinor Số tiền đã nhận theo minor unit.
 * @param input.description Mô tả transaction wallet.
 * @param input.hash Khóa idempotency cho wallet ledger.
 * @param input.errorOperation Tên operation dùng khi wrap lỗi provider.
 */
export function settleSuccessfulTopup(
  client: import("generated/prisma/client").PrismaClient,
  attempt: {
    readonly id: string;
    readonly userId: string;
    readonly currency: string;
  },
  input: {
    readonly providerRef: string;
    readonly amountMinor: bigint;
    readonly description: string;
    readonly hash: string;
    readonly errorOperation: string;
  },
): Effect.Effect<StripeWebhookOutcome, TopupProviderError> {
  return runPrismaTransaction(client, tx =>
    Effect.gen(function* () {
      const txPaymentAttemptRepo = makePaymentAttemptRepository(tx);
      const txWalletCommandRepo = makeWalletCommandRepository(tx);
      const txWalletQueryRepo = makeWalletQueryRepository(tx);

      const updated = yield* txPaymentAttemptRepo.markSucceededIfPending(attempt.id, input.providerRef);
      if (!updated) {
        return { status: "ignored", reason: "already_processed" } as StripeWebhookOutcome;
      }

      const creditResult = yield* creditWallet(txWalletCommandRepo, txWalletQueryRepo, {
        userId: attempt.userId,
        amount: input.amountMinor,
        description: input.description,
        hash: input.hash,
        type: "DEPOSIT",
      }).pipe(Effect.either);

      return yield* Match.value(creditResult).pipe(
        Match.tag("Right", () =>
          Effect.succeed({ status: "succeeded", paymentAttemptId: attempt.id } as StripeWebhookOutcome)),
        Match.tag("Left", ({ left }) => {
          if (left._tag === "WalletNotFound") {
            return txPaymentAttemptRepo.markFailedIfPending(attempt.id, "wallet_missing").pipe(
              Effect.as({
                status: "failed",
                paymentAttemptId: attempt.id,
                reason: "wallet_missing",
              } as StripeWebhookOutcome),
            );
          }

          return Effect.fail(new TopupProviderError({
            operation: input.errorOperation,
            provider: "stripe",
            cause: left,
          }));
        }),
        Match.exhaustive,
      );
    })).pipe(
    defectOn(PrismaTransactionError),
  );
}
