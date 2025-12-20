import { Effect, Option } from "effect";

import { env } from "@/config/env";
import { WalletServiceTag } from "@/domain/wallets";
import { Email } from "@/infrastructure/email";
import { Prisma } from "@/infrastructure/prisma";

import type { SubscriptionPackage } from "../../../../generated/prisma/client";
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

function computeExpiresAt(now: Date): Date {
  return new Date(now.getTime() + EXPIRE_AFTER_MS);
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
  SubscriptionServiceTag | WalletServiceTag | Prisma | Email
> {
  return Effect.gen(function* () {
    const service = yield* SubscriptionServiceTag;
    const walletService = yield* WalletServiceTag;
    const { client } = yield* Prisma;
    const emailer = yield* Email; // all the le dependencies are resolved here
    const now = args.now ?? new Date();

    const created = yield* Effect.tryPromise({
      try: () => client.$transaction(async (tx) => {
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

        return pending;
      }),
      catch: err => err as CreateSubscriptionFailure,
    });

    const createdOn = now.toISOString().slice(0, 10);
    const html = [
      `<p>Hi ${args.fullName},</p>`,
      `<p>Your subscription (${args.packageName}) was created on ${createdOn}.</p>`,
      "<p>We will activate it shortly. Thank you for choosing MeBike.</p>",
      "<!-- TODO: replace with real email template -->",
    ].join("");

    yield* emailer.send({
      to: args.email,
      subject: "Subscription created",
      html,
    }).pipe(Effect.catchAll(err => Effect.die(err)));

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
