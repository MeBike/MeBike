import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { SubscriptionRepositoryError } from "@/domain/subscriptions/domain-errors";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectDefect, expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeSubscriptionCommandRepository } from "../subscription-command.repository";
import { makeSubscriptionQueryRepository } from "../subscription-query.repository";

describe("subscriptionRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let queryRepo: ReturnType<typeof makeSubscriptionQueryRepository>;
  let commandRepo: ReturnType<typeof makeSubscriptionCommandRepository>;

  beforeAll(() => {
    queryRepo = makeSubscriptionQueryRepository(fixture.prisma);
    commandRepo = makeSubscriptionCommandRepository(fixture.prisma);
  });

  const createUser = async () => {
    const user = await fixture.factories.user({ fullname: "Subscription User" });
    return { id: user.id };
  };

  it("createPending + findById returns subscription", async () => {
    const { id: userId } = await createUser();

    const created = await Effect.runPromise(
      commandRepo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 10,
        price: 1000n,
      }),
    );

    const found = await Effect.runPromise(queryRepo.findById(created.id));
    if (Option.isNone(found)) {
      throw new Error("Expected subscription to exist");
    }
    expect(found.value.userId).toBe(userId);
  });

  it("listForUser returns subscriptions", async () => {
    const { id: userId } = await createUser();

    await Effect.runPromise(
      commandRepo.createPending({
        userId,
        packageName: "premium",
        maxUsages: null,
        price: 2000n,
      }),
    );

    const result = await Effect.runPromise(
      queryRepo.listForUser(userId, {}, { page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("activate updates subscription status", async () => {
    const { id: userId } = await createUser();

    const created = await Effect.runPromise(
      commandRepo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 5,
        price: 500n,
      }),
    );

    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await Effect.runPromise(
      commandRepo.activate({
        subscriptionId: created.id,
        activatedAt,
        expiresAt,
      }),
    );

    if (Option.isNone(result)) {
      throw new Error("Expected activation to succeed");
    }
    expect(result.value.status).toBe("ACTIVE");
  });

  it("incrementUsage increments usage count", async () => {
    const { id: userId } = await createUser();

    const created = await Effect.runPromise(
      commandRepo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 5,
        price: 500n,
      }),
    );

    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const activated = await Effect.runPromise(
      commandRepo.activate({
        subscriptionId: created.id,
        activatedAt,
        expiresAt,
      }),
    );

    if (Option.isNone(activated)) {
      throw new Error("Expected activation to succeed");
    }

    const updated = await Effect.runPromise(
      commandRepo.incrementUsage(activated.value.id, 0, 1),
    );

    if (Option.isNone(updated)) {
      throw new Error("Expected usage increment to succeed");
    }
    expect(updated.value.usageCount).toBe(1);
  });

  it("markExpiredNow updates expired subscriptions", async () => {
    const { id: userId } = await createUser();

    const created = await Effect.runPromise(
      commandRepo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 5,
        price: 500n,
      }),
    );

    const expiredAt = new Date(Date.now() - 60 * 1000);
    const activated = await Effect.runPromise(
      commandRepo.activate({
        subscriptionId: created.id,
        activatedAt: expiredAt,
        expiresAt: expiredAt,
      }),
    );

    if (Option.isNone(activated)) {
      throw new Error("Expected activation to succeed");
    }

    const count = await Effect.runPromise(commandRepo.markExpiredNow(new Date()));
    expect(count).toBe(1);
  });

  it("activate rejects when another active subscription exists", async () => {
    const { id: userId } = await createUser();

    const first = await Effect.runPromise(
      commandRepo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 5,
        price: 500n,
      }),
    );
    const second = await Effect.runPromise(
      commandRepo.createPending({
        userId,
        packageName: "premium",
        maxUsages: 5,
        price: 1500n,
      }),
    );

    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Effect.runPromise(
      commandRepo.activate({
        subscriptionId: first.id,
        activatedAt,
        expiresAt,
      }),
    );

    const result = await Effect.runPromise(
      commandRepo
        .activate({
          subscriptionId: second.id,
          activatedAt,
          expiresAt,
        })
        .pipe(Effect.either),
    );

    expectLeftTag(result, "ActiveSubscriptionExists");
  });

  it("defects with SubscriptionRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = makeSubscriptionQueryRepository(broken.client);

      await expectDefect(
        brokenRepo.findById(uuidv7()),
        SubscriptionRepositoryError,
        { operation: "findById" },
      );
    }
    finally {
      await broken.stop();
    }
  });

  it("enforces unique ACTIVE subscription per user (partial unique index)", async () => {
    const { id: userId } = await createUser();
    const now = new Date();

    await fixture.prisma.subscription.create({
      data: {
        id: uuidv7(),
        userId,
        packageName: "basic",
        maxUsages: 10,
        usageCount: 0,
        status: "ACTIVE",
        activatedAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        price: 1000n,
      },
    });

    await expect(
      fixture.prisma.subscription.create({
        data: {
          id: uuidv7(),
          userId,
          packageName: "premium",
          maxUsages: 5,
          usageCount: 0,
          status: "ACTIVE",
          activatedAt: now,
          expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          price: 2000n,
        },
      }),
    ).rejects.toBeDefined();

    const activeCount = await fixture.prisma.subscription.count({
      where: { userId, status: "ACTIVE" },
    });
    expect(activeCount).toBe(1);
  });
});
