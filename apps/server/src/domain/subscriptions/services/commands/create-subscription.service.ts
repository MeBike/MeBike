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

import type { SubscriptionRow } from "../../models";
import type { CreateSubscriptionFailure } from "../shared/subscription-flow.shared";

import { SubscriptionPendingOrActiveExists as SubscriptionPendingOrActiveExistsError } from "../../domain-errors";
import { getSubscriptionPackageConfig } from "../../package-config";
import { makeSubscriptionCommandRepository } from "../../repository/subscription-command.repository";
import { makeSubscriptionQueryRepository } from "../../repository/subscription-query.repository";
import { computeAutoActivateAt } from "../shared/subscription-flow.shared";

/**
 * Tao subscription moi o trang thai pending, tru tien vi ngay, roi enqueue cac side effect can thiet.
 *
 * Toan bo flow duoc goi trong mot transaction de cac buoc sau luon di cung nhau:
 * 1. kiem tra user chua co goi pending/active
 * 2. tao row subscription pending
 * 3. tru tien vi
 * 4. enqueue job auto-activate va email xac nhan
 *
 * @param args Thong tin tao subscription moi.
 * @param args.userId User mua goi.
 * @param args.packageName Goi subscription duoc chon.
 * @param args.email Email nhan thong bao tao goi.
 * @param args.fullName Ten hien thi trong email xac nhan.
 * @param args.now Moc thoi gian tao subscription. Mac dinh dung thoi gian hien tai.
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
 * Tru tien vi va map loi wallet sang loi domain cua luong mua subscription.
 *
 * @param repo Wallet repository dang chay trong transaction hien tai.
 * @param input Thong tin debit can ap dung cho vi user.
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
