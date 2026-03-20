import { Effect, Layer, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import type { Prisma as PrismaNS } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { expectLeftTag } from "@/test/effect/assertions";
import { runEffectWithLayer } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeSubscriptionRepository, SubscriptionRepository } from "../..";
import { SubscriptionServiceLive, SubscriptionServiceTag } from "../subscription.service";

describe("subscriptionService Integration", () => {
  const fixture = setupPrismaIntFixture();
  let depsLayer: Layer.Layer<SubscriptionServiceTag | SubscriptionRepository | Prisma, never, never>;

  beforeAll(() => {
    const subscriptionRepoLayer = Layer.succeed(
      SubscriptionRepository,
      makeSubscriptionRepository(fixture.prisma),
    );
    const subscriptionServiceLayer = SubscriptionServiceLive.pipe(
      Layer.provide(subscriptionRepoLayer),
    );

    depsLayer = Layer.mergeAll(
      Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma })),
      subscriptionRepoLayer,
      subscriptionServiceLayer,
    );
  });

  const createUser = async () => {
    const user = await fixture.factories.user({ fullname: "Subscription User" });
    return { id: user.id };
  };

  const runWithService = <A, E>(
    eff: Effect.Effect<A, E, SubscriptionServiceTag>,
  ) =>
    runEffectWithLayer(eff, depsLayer);

  const runInTxWithService = async <A, E>(
    f: (tx: PrismaNS.TransactionClient) => Effect.Effect<A, E, SubscriptionServiceTag>,
  ) =>
    fixture.prisma.$transaction(async tx =>
      Effect.runPromise(f(tx).pipe(Effect.provide(depsLayer))),
    );

  it("createPending + findById returns subscription", async () => {
    const { id: userId } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 10,
          price: 1000n,
        })),
    );

    const found = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.findById(created.id)),
    );

    if (Option.isNone(found)) {
      throw new Error("Expected subscription to exist");
    }
    expect(found.value.userId).toBe(userId);
  });

  it("activate + incrementUsage updates subscription", async () => {
    const { id: userId } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 5,
          price: 500n,
        })),
    );

    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const activated = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.activate({
          subscriptionId: created.id,
          activatedAt,
          expiresAt,
        })),
    );

    const updated = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.incrementUsage(activated.id, 0, 1)),
    );

    expect(updated.usageCount).toBe(1);
  });

  it("useOneInTx increments usage for PENDING subscription", async () => {
    const { id: userId } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 2,
          price: 1000n,
        })),
    );

    const used = await runInTxWithService(
      tx =>
        Effect.flatMap(SubscriptionServiceTag, service =>
          service.useOneInTx(tx, { subscriptionId: created.id, userId })),
    );

    expect(used.id).toBe(created.id);
    expect(used.userId).toBe(userId);
    expect(used.status).toBe("ACTIVE");
    expect(used.usageCount).toBe(1);
  });

  it("useOneInTx fails with SubscriptionNotFound for missing id", async () => {
    const { id: userId } = await createUser();

    const result = await runInTxWithService(
      tx =>
        Effect.flatMap(SubscriptionServiceTag, service =>
          service.useOneInTx(tx, { subscriptionId: uuidv7(), userId }).pipe(Effect.either)),
    );

    expectLeftTag(result, "SubscriptionNotFound");
  });

  it("useOneInTx fails with SubscriptionNotUsable for wrong user", async () => {
    const { id: userA } = await createUser();
    const { id: userB } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.createPending({
          userId: userA,
          packageName: "basic",
          maxUsages: 2,
          price: 1000n,
        })),
    );

    const result = await runInTxWithService(
      tx =>
        Effect.flatMap(SubscriptionServiceTag, service =>
          service.useOneInTx(tx, { subscriptionId: created.id, userId: userB }).pipe(Effect.either)),
    );

    expectLeftTag(result, "SubscriptionNotUsable");
  });

  it("useOneInTx fails with SubscriptionUsageExceeded when maxUsages is reached", async () => {
    const { id: userId } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 1,
          price: 1000n,
        })),
    );

    await runInTxWithService(
      tx =>
        Effect.flatMap(SubscriptionServiceTag, service =>
          service.useOneInTx(tx, { subscriptionId: created.id, userId })),
    );

    const result = await runInTxWithService(
      tx =>
        Effect.flatMap(SubscriptionServiceTag, service =>
          service.useOneInTx(tx, { subscriptionId: created.id, userId }).pipe(Effect.either)),
    );

    expectLeftTag(result, "SubscriptionUsageExceeded");
  });

  it("activate rejects when another active subscription exists", async () => {
    const { id: userId } = await createUser();

    const first = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 5,
          price: 500n,
        })),
    );
    const second = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.createPending({
          userId,
          packageName: "premium",
          maxUsages: 5,
          price: 1500n,
        })),
    );

    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.activate({
          subscriptionId: first.id,
          activatedAt,
          expiresAt,
        })),
    );

    const result = await runWithService(
      Effect.flatMap(SubscriptionServiceTag, service =>
        service.activate({
          subscriptionId: second.id,
          activatedAt,
          expiresAt,
        }).pipe(Effect.either)),
    );

    expectLeftTag(result, "ActiveSubscriptionExists");
  });
});
