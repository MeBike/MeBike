import { Effect, Option } from "effect";

import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { SubscriptionPackage } from "generated/prisma/client";

import { toMinorUnit } from "@/domain/shared/money";
import { makeWalletRepository } from "@/domain/wallets";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";
import { buildSubscriptionCreatedEmail } from "@/lib/email-templates";

import type { SubscriptionRow } from "../models";
import type { CreateSubscriptionFailure } from "./subscription-flows.shared";

import { SubscriptionPendingOrActiveExists as SubscriptionPendingOrActiveExistsError } from "../domain-errors";
import { getSubscriptionPackageConfig } from "../package-config";
import { makeSubscriptionRepository } from "../repository/subscription.repository";
import { SubscriptionServiceTag } from "../services/subscription.service";
import { computeAutoActivateAt } from "./subscription-flows.shared";

export function createSubscriptionUseCase(args: {
  userId: string;
  packageName: SubscriptionPackage;
  email: string;
  fullName: string;
  now?: Date;
}): Effect.Effect<
  SubscriptionRow,
  CreateSubscriptionFailure,
  SubscriptionServiceTag | Prisma
> {
  return Effect.gen(function* () {
    yield* SubscriptionServiceTag;
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
        const txRepo = makeSubscriptionRepository(tx);

        const existing = yield* txRepo.findCurrentForUser(
          args.userId,
          ["PENDING", "ACTIVE"],
        );
        if (Option.isSome(existing)) {
          return yield* Effect.fail(
            new SubscriptionPendingOrActiveExistsError({ userId: args.userId }),
          );
        }

        const pending = yield* txRepo.createPending({
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
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    return created;
  });
}

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
