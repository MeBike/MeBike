import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";


import { getTestDatabase } from "@/test/db/test-database";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeSubscriptionRepository } from "../subscription.repository";

describe("subscriptionRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeSubscriptionRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();
    

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeSubscriptionRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.subscription.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  const createUser = async () => {
    const id = uuidv7();
    await client.user.create({
      data: {
        id,
        fullname: "Subscription User",
        email: `user-${id}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    return { id };
  };

  const expectLeftTag = <E extends { _tag: string }>(
    result: Either.Either<unknown, E>,
    tag: E["_tag"],
  ) => {
    if (Either.isRight(result)) {
      throw new Error(`Expected Left ${tag}, got Right`);
    }
    expect(result.left._tag).toBe(tag);
  };

  it("createPending + findById returns subscription", async () => {
    const { id: userId } = await createUser();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 10,
        price: 1000n,
      }),
    );

    const found = await Effect.runPromise(repo.findById(created.id));
    if (Option.isNone(found)) {
      throw new Error("Expected subscription to exist");
    }
    expect(found.value.userId).toBe(userId);
  });

  it("listForUser returns subscriptions", async () => {
    const { id: userId } = await createUser();

    await Effect.runPromise(
      repo.createPending({
        userId,
        packageName: "premium",
        maxUsages: null,
        price: 2000n,
      }),
    );

    const result = await Effect.runPromise(
      repo.listForUser(userId, {}, { page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("activate updates subscription status", async () => {
    const { id: userId } = await createUser();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 5,
        price: 500n,
      }),
    );

    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await Effect.runPromise(
      repo.activate({
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
      repo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 5,
        price: 500n,
      }),
    );

    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const activated = await Effect.runPromise(
      repo.activate({
        subscriptionId: created.id,
        activatedAt,
        expiresAt,
      }),
    );

    if (Option.isNone(activated)) {
      throw new Error("Expected activation to succeed");
    }

    const updated = await Effect.runPromise(
      repo.incrementUsage(activated.value.id, 0, 1),
    );

    if (Option.isNone(updated)) {
      throw new Error("Expected usage increment to succeed");
    }
    expect(updated.value.usageCount).toBe(1);
  });

  it("markExpiredNow updates expired subscriptions", async () => {
    const { id: userId } = await createUser();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 5,
        price: 500n,
      }),
    );

    const expiredAt = new Date(Date.now() - 60 * 1000);
    const activated = await Effect.runPromise(
      repo.activate({
        subscriptionId: created.id,
        activatedAt: expiredAt,
        expiresAt: expiredAt,
      }),
    );

    if (Option.isNone(activated)) {
      throw new Error("Expected activation to succeed");
    }

    const count = await Effect.runPromise(repo.markExpiredNow(new Date()));
    expect(count).toBe(1);
  });

  it("activate rejects when another active subscription exists", async () => {
    const { id: userId } = await createUser();

    const first = await Effect.runPromise(
      repo.createPending({
        userId,
        packageName: "basic",
        maxUsages: 5,
        price: 500n,
      }),
    );
    const second = await Effect.runPromise(
      repo.createPending({
        userId,
        packageName: "premium",
        maxUsages: 5,
        price: 1500n,
      }),
    );

    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Effect.runPromise(
      repo.activate({
        subscriptionId: first.id,
        activatedAt,
        expiresAt,
      }),
    );

    const result = await Effect.runPromise(
      repo
        .activate({
          subscriptionId: second.id,
          activatedAt,
          expiresAt,
        })
        .pipe(Effect.either),
    );

    expectLeftTag(result, "ActiveSubscriptionExists");
  });

  it("returns SubscriptionRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeSubscriptionRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findById(uuidv7()).pipe(Effect.either),
    );

    expectLeftTag(result, "SubscriptionRepositoryError");

    await broken.stop();
  });

  it("enforces unique ACTIVE subscription per user (partial unique index)", async () => {
    const { id: userId } = await createUser();
    const now = new Date();

    await client.subscription.create({
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
      client.subscription.create({
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

    const activeCount = await client.subscription.count({
      where: { userId, status: "ACTIVE" },
    });
    expect(activeCount).toBe(1);
  });
});
