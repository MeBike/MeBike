import { Effect, Option } from "effect";

import type { SubscriptionPackage } from "generated/prisma/client";

import { env } from "@/config/env";
import { toMinorUnit } from "@/domain/shared/money";
import { WalletServiceTag } from "@/domain/wallets";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";
import { buildSubscriptionCreatedEmail } from "@/lib/email-templates";

import type {
  ActiveSubscriptionExists,
  SubscriptionExpired,
  SubscriptionNotFound,
  SubscriptionNotPending,
  SubscriptionNotUsable,
  SubscriptionPendingOrActiveExists,
  SubscriptionRepositoryError,
  SubscriptionUsageExceeded,
} from "../domain-errors";
import type { SubscriptionRow } from "../models";

import {
  SubscriptionExpired as SubscriptionExpiredError,
  SubscriptionNotFound as SubscriptionNotFoundError,
  SubscriptionNotPending as SubscriptionNotPendingError,
  SubscriptionNotUsable as SubscriptionNotUsableError,
  SubscriptionPendingOrActiveExists as SubscriptionPendingOrActiveExistsError,
  SubscriptionUsageExceeded as SubscriptionUsageExceededError,
} from "../domain-errors";
import { getSubscriptionPackageConfig } from "../package-config";
import { SubscriptionServiceTag } from "../services/subscription.service";

export type UseSubscriptionFailure
  = | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionExpired
    | SubscriptionUsageExceeded
    | SubscriptionRepositoryError
    | ActiveSubscriptionExists;

export type CreateSubscriptionFailure
  = | SubscriptionPendingOrActiveExists
    | SubscriptionRepositoryError
    | import("../../wallets/domain-errors").InsufficientWalletBalance
    | import("../../wallets/domain-errors").WalletNotFound
    | import("../../wallets/domain-errors").WalletRepositoryError;

export type ActivateSubscriptionFailure
  = | SubscriptionNotFound
    | SubscriptionNotPending
    | SubscriptionRepositoryError
    | ActiveSubscriptionExists;

const EXPIRE_AFTER_MS = env.EXPIRE_AFTER_DAYS * 24 * 60 * 60 * 1000;
const AUTO_ACTIVATE_MS = env.AUTO_ACTIVATE_IN_DAYS * 24 * 60 * 60 * 1000;

function computeExpiresAt(now: Date): Date {
  return new Date(now.getTime() + EXPIRE_AFTER_MS);
}

function computeAutoActivateAt(now: Date): Date {
  return new Date(now.getTime() + AUTO_ACTIVATE_MS);
}

export function createSubscriptionUseCase(args: {
  userId: string;
  packageName: SubscriptionPackage;
  email: string;
  fullName: string;
  now?: Date;
}): Effect.Effect<
  SubscriptionRow,
  CreateSubscriptionFailure,
  SubscriptionServiceTag | WalletServiceTag | Prisma
> {
  return Effect.gen(function* () {
    const service = yield* SubscriptionServiceTag;
    const walletService = yield* WalletServiceTag;
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
        const existing = yield* service.findCurrentForUserInTx(
          tx,
          args.userId,
          ["PENDING", "ACTIVE"],
        );
        if (Option.isSome(existing)) {
          return yield* Effect.fail(
            new SubscriptionPendingOrActiveExistsError({ userId: args.userId }),
          );
        }

        const pending = yield* service.createPendingInTx(tx, {
          userId: args.userId,
          packageName: args.packageName,
          maxUsages: packageConfig.maxUsages,
          price: packageConfig.price,
        });

        const priceMinor = toMinorUnit(packageConfig.price);
        yield* walletService.debitWalletInTx(tx, {
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

export function activateSubscriptionUseCase(args: {
  subscriptionId: string;
  now?: Date;
}): Effect.Effect<
  SubscriptionRow,
  ActivateSubscriptionFailure,
  SubscriptionServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* SubscriptionServiceTag;
    const now = args.now ?? new Date();

    const subOpt = yield* service.findById(args.subscriptionId);
    if (Option.isNone(subOpt)) {
      return yield* Effect.fail(
        new SubscriptionNotFoundError({ subscriptionId: args.subscriptionId }),
      );
    }

    const sub = subOpt.value;

    if (sub.status !== "PENDING") {
      return yield* Effect.fail(
        new SubscriptionNotPendingError({ subscriptionId: sub.id }),
      );
    }

    const activated = yield* service.activate({
      subscriptionId: sub.id,
      activatedAt: now,
      expiresAt: computeExpiresAt(now),
    });
    return activated;
  });
}

export function useSubscriptionOnceUseCase(args: {
  subscriptionId: string;
  userId: string;
  now?: Date;
}): Effect.Effect<SubscriptionRow, UseSubscriptionFailure, SubscriptionServiceTag> {
  return Effect.gen(function* () {
    const service = yield* SubscriptionServiceTag;
    const now = args.now ?? new Date();
    // TODO: add a small bounded retry when incrementUsage CAS fails due to concurrent usage.

    const subOpt = yield* service.findById(args.subscriptionId);
    if (Option.isNone(subOpt)) {
      return yield* Effect.fail(
        new SubscriptionNotFoundError({ subscriptionId: args.subscriptionId }),
      );
    }

    const sub = subOpt.value;

    if (sub.userId !== args.userId) {
      return yield* Effect.fail(
        new SubscriptionNotUsableError({
          subscriptionId: sub.id,
          status: sub.status,
        }),
      );
    }

    if (sub.status === "CANCELLED" || sub.status === "EXPIRED") {
      return yield* Effect.fail(
        new SubscriptionNotUsableError({
          subscriptionId: sub.id,
          status: sub.status,
        }),
      );
    }

    if (sub.expiresAt && sub.expiresAt <= now) {
      return yield* Effect.fail(
        new SubscriptionExpiredError({ subscriptionId: sub.id }),
      );
    }

    if (sub.maxUsages !== null && sub.usageCount >= sub.maxUsages) {
      return yield* Effect.fail(
        new SubscriptionUsageExceededError({
          subscriptionId: sub.id,
          usageCount: sub.usageCount,
          maxUsages: sub.maxUsages,
        }),
      );
    }

    const maybeActivated = sub.status === "PENDING"
      ? yield* service.activate({
        subscriptionId: sub.id,
        activatedAt: now,
        expiresAt: computeExpiresAt(now),
      }).pipe(
        Effect.catchTag(
          "SubscriptionNotPending",
          err =>
            Effect.fail(new SubscriptionNotUsableError({
              subscriptionId: err.subscriptionId,
              status: "PENDING",
            })),
        ),
      )
      : sub;

    const incremented = yield* service.incrementUsage(
      maybeActivated.id,
      maybeActivated.usageCount,
      1,
    );

    return incremented;
  });
}
