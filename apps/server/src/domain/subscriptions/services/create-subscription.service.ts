import { Effect, Option } from "effect";

import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { SubscriptionPackage } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { toMinorUnit } from "@/domain/shared/money";
import { makeWalletRepository } from "@/domain/wallets";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";
import { buildSubscriptionCreatedEmail } from "@/lib/email-templates";

import type { SubscriptionRow } from "../models";
import type { CreateSubscriptionFailure } from "./subscription-flows.shared";

import { SubscriptionPendingOrActiveExists as SubscriptionPendingOrActiveExistsError } from "../domain-errors";
import { getSubscriptionPackageConfig } from "../package-config";
import { makeSubscriptionCommandRepository } from "../repository/subscription-command.repository";
import { makeSubscriptionQueryRepository } from "../repository/subscription-query.repository";
import { computeAutoActivateAt } from "./subscription-flows.shared";

/**
 * Tạo subscription mới ở trạng thái pending, trừ tiền ví ngay, rồi enqueue các side effect cần thiết.
 *
 * Toàn bộ flow được gói trong một transaction để các bước sau luôn đi cùng nhau:
 * 1. kiểm tra user chưa có gói pending/active
 * 2. tạo row subscription pending
 * 3. trừ tiền ví
 * 4. enqueue job auto-activate và email xác nhận
 */
export function createSubscriptionUseCase(args: {
  userId: string;
  packageName: SubscriptionPackage;
  email: string;
  fullName: string;
  now?: Date;
}): Effect.Effect<
  SubscriptionRow,
  CreateSubscriptionFailure,
  Prisma
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const now = args.now ?? new Date();
    const packageConfig = getSubscriptionPackageConfig(args.packageName);
    const createdOn = now.toISOString().slice(0, 10);
    const subscriptionEmail = buildSubscriptionCreatedEmail({
      fullName: args.fullName,
      packageName: args.packageName,
      price: Number(packageConfig.price.toString()),
      maxUsages: packageConfig.maxUsages,
      createdOn,
      // TODO: Provide a real callback URL once we standardize a `FRONTEND_URL`/`APP_WEB_URL` env.
    });

    const created = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txSubscriptionQueryRepo = makeSubscriptionQueryRepository(tx);
        const txSubscriptionCommandRepo = makeSubscriptionCommandRepository(tx);

        const existing = yield* txSubscriptionQueryRepo.findCurrentForUser(
          args.userId,
          ["PENDING", "ACTIVE"],
        );
        if (Option.isSome(existing)) {
          return yield* Effect.fail(
            new SubscriptionPendingOrActiveExistsError({ userId: args.userId }),
          );
        }

        const pending = yield* txSubscriptionCommandRepo.createPending({
          userId: args.userId,
          packageName: args.packageName,
          maxUsages: packageConfig.maxUsages,
          price: packageConfig.price,
        });

        const priceMinor = toMinorUnit(packageConfig.price);
        yield* debitWallet(makeWalletRepository(tx), {
          userId: args.userId,
          amount: priceMinor,
          description: `Subscription payment ${pending.id}`,
          type: "DEBIT",
        });

        yield* enqueueOutboxJobInTx(tx, {
          type: JobTypes.SubscriptionAutoActivate,
          dedupeKey: pending.id,
          payload: {
            version: 1,
            subscriptionId: pending.id,
          },
          runAt: computeAutoActivateAt(now),
        });

        yield* enqueueOutboxJobInTx(tx, {
          type: JobTypes.EmailSend,
          dedupeKey: `subscription-created:${pending.id}`,
          payload: {
            version: 1,
            to: args.email,
            kind: "raw",
            subject: subscriptionEmail.subject,
            html: subscriptionEmail.html,
          },
          runAt: now,
        });

        return pending;
      })).pipe(
      defectOn(PrismaTransactionError),
    );

    return created;
  });
}

/**
 * Trừ tiền ví và map lỗi wallet sang lỗi domain của luồng mua subscription.
 */
function debitWallet(
  repo: ReturnType<typeof makeWalletRepository>,
  input: DecreaseBalanceInput,
) {
  return repo.decreaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new WalletNotFound({ userId: input.userId }))),
    Effect.catchTag("WalletBalanceConstraint", (err: WalletBalanceConstraint) =>
      Effect.fail(new InsufficientWalletBalance({
        walletId: err.walletId,
        userId: err.userId,
        balance: err.balance,
        attemptedDebit: err.attemptedDebit,
      }))),
  );
}
