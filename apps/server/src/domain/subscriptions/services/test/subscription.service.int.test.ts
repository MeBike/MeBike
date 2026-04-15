import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import {
  SubscriptionCommandServiceTag,
  SubscriptionQueryServiceTag,
} from "@/domain/subscriptions";
import { expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeSubscriptionRunners, makeSubscriptionTestLayer } from "./subscription-test-kit";

describe("subscriptionService Integration", () => {
  const fixture = setupPrismaIntFixture();
  let runWithService: ReturnType<typeof makeSubscriptionRunners>["runWithService"];
  let runInTxWithService: ReturnType<typeof makeSubscriptionRunners>["runInTxWithService"];

  beforeAll(() => {
    const runners = makeSubscriptionRunners(makeSubscriptionTestLayer(fixture.prisma));
    runWithService = runners.runWithService;
    runInTxWithService = runners.runInTxWithService;
  });

  const createUser = async () => {
    const user = await fixture.factories.user({ fullname: "Subscription User" });
    return { id: user.id };
  };

  it("createPending + getById returns subscription", async () => {
    const { id: userId } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 10,
          price: 1000n,
        })),
    );

    const found = await runWithService(
      Effect.flatMap(SubscriptionQueryServiceTag, service =>
        service.getById(created.id)),
    );

    if (Option.isNone(found)) {
      throw new Error("Expected subscription to exist");
    }
    expect(found.value.userId).toBe(userId);
  });

  it("activate + incrementUsage updates subscription", async () => {
    const { id: userId } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
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
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.activate({
          subscriptionId: created.id,
          activatedAt,
          expiresAt,
        })),
    );

    const updated = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.incrementUsage(activated.id, 0, 1)),
    );

    expect(updated.usageCount).toBe(1);
  });

  it("useOne increments usage for PENDING subscription", async () => {
    const { id: userId } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 2,
          price: 1000n,
        })),
    );

    const used = await runInTxWithService(
      fixture.prisma,
      tx =>
        Effect.flatMap(SubscriptionCommandServiceTag, service =>
          service.useOne(tx, { subscriptionId: created.id, userId })),
    );

    expect(used.id).toBe(created.id);
    expect(used.userId).toBe(userId);
    expect(used.status).toBe("ACTIVE");
    expect(used.usageCount).toBe(1);
  });

  it("useOne fails with SubscriptionNotFound for missing id", async () => {
    const { id: userId } = await createUser();

    const result = await runInTxWithService(
      fixture.prisma,
      tx =>
        Effect.flatMap(SubscriptionCommandServiceTag, service =>
          service.useOne(tx, { subscriptionId: uuidv7(), userId }).pipe(Effect.either)),
    );

    expectLeftTag(result, "SubscriptionNotFound");
  });

  it("useOne fails with SubscriptionNotUsable for wrong user", async () => {
    const { id: userA } = await createUser();
    const { id: userB } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.createPending({
          userId: userA,
          packageName: "basic",
          maxUsages: 2,
          price: 1000n,
        })),
    );

    const result = await runInTxWithService(
      fixture.prisma,
      tx =>
        Effect.flatMap(SubscriptionCommandServiceTag, service =>
          service.useOne(tx, { subscriptionId: created.id, userId: userB }).pipe(Effect.either)),
    );

    expectLeftTag(result, "SubscriptionNotUsable");
  });

  it("useOne fails with SubscriptionUsageExceeded when maxUsages is reached", async () => {
    const { id: userId } = await createUser();

    const created = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 1,
          price: 1000n,
        })),
    );

    await runInTxWithService(
      fixture.prisma,
      tx =>
        Effect.flatMap(SubscriptionCommandServiceTag, service =>
          service.useOne(tx, { subscriptionId: created.id, userId })),
    );

    const result = await runInTxWithService(
      fixture.prisma,
      tx =>
        Effect.flatMap(SubscriptionCommandServiceTag, service =>
          service.useOne(tx, { subscriptionId: created.id, userId }).pipe(Effect.either)),
    );

    expectLeftTag(result, "SubscriptionUsageExceeded");
  });

  it("activate rejects when another active subscription exists", async () => {
    const { id: userId } = await createUser();

    const first = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.createPending({
          userId,
          packageName: "basic",
          maxUsages: 5,
          price: 500n,
        })),
    );
    const second = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
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
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.activate({
          subscriptionId: first.id,
          activatedAt,
          expiresAt,
        })),
    );

    const result = await runWithService(
      Effect.flatMap(SubscriptionCommandServiceTag, service =>
        service.activate({
          subscriptionId: second.id,
          activatedAt,
          expiresAt,
        }).pipe(Effect.either)),
    );

    expectLeftTag(result, "ActiveSubscriptionExists");
  });
});
