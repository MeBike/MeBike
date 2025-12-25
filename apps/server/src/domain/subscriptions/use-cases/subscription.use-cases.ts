import { Effect, Option } from "effect";

import type { SubscriptionPackage } from "generated/prisma/client";

import { env } from "@/config/env";
import { WalletServiceTag } from "@/domain/wallets";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJob } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
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
  price: SubscriptionRow["price"];
  maxUsages: number | null; // null means unlimited
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
    const createdOn = now.toISOString().slice(0, 10);
    const subscriptionEmail = buildSubscriptionCreatedEmail({
      fullName: args.fullName,
      packageName: args.packageName,
      price: args.price,
      maxUsages: args.maxUsages,
      createdOn,
      // TODO: Provide a real callback URL once we standardize a `FRONTEND_URL`/`APP_WEB_URL` env.
    });

    const created = yield* Effect.tryPromise({
      try: () => client.$transaction(async (tx) => {
        // TODO(effect-env): Avoid `Effect.runPromise` inside `$transaction` callbacks when the Effect depends on Context/Layer.
        // `runPromise` starts a new runtime without the outer environment, which can fail with "Service not found".
        // Prefer tx-only repo functions (no Tag dependencies), or provide the captured Context explicitly.
        const existing = await service.findCurrentForUserInTx(
          tx,
          args.userId,
          ["PENDING", "ACTIVE"],
        ).pipe(Effect.runPromise);
        if (Option.isSome(existing)) {
          throw new SubscriptionPendingOrActiveExistsError({ userId: args.userId });
        }

        const pending = await service.createPendingInTx(tx, {
          userId: args.userId,
          packageName: args.packageName,
          maxUsages: args.maxUsages,
          price: args.price,
        }).pipe(Effect.runPromise);

        await walletService.debitWalletInTx(tx, {
          userId: args.userId,
          amount: args.price,
          description: `Subscription payment ${pending.id}`,
          type: "DEBIT",
        }).pipe(Effect.runPromise);

        await enqueueOutboxJob(tx, {
          type: JobTypes.SubscriptionAutoActivate,
          dedupeKey: pending.id,
          payload: {
            version: 1,
            subscriptionId: pending.id,
          },
          runAt: computeAutoActivateAt(now),
        });

        await enqueueOutboxJob(tx, {
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
      }),
      catch: err => err as CreateSubscriptionFailure,
    });

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

    const activatedOpt = yield* service.activate({
      subscriptionId: sub.id,
      activatedAt: now,
      expiresAt: computeExpiresAt(now),
    });

    if (Option.isNone(activatedOpt)) {
      return yield* Effect.fail(
        new SubscriptionNotPendingError({ subscriptionId: sub.id }),
      );
    }

    return activatedOpt.value;
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
      })
      : Option.some<SubscriptionRow>(sub);

    if (Option.isNone(maybeActivated)) {
      return yield* Effect.fail(
        new SubscriptionNotUsableError({
          subscriptionId: sub.id,
          status: "PENDING",
        }),
      );
    }

    const incremented = yield* service.incrementUsage(
      sub.id,
      sub.usageCount,
      1,
    );
    if (Option.isNone(incremented)) {
      return yield* Effect.fail(
        new SubscriptionNotUsableError({
          subscriptionId: sub.id,
          status: "ACTIVE",
        }),
      );
    }

    return incremented.value;
  });
}
