import { PrismaPg } from "@prisma/adapter-pg";
import { Effect } from "effect";
import { afterAll, beforeAll, describe, expect, it } from "vitest";


import { getTestDatabase } from "@/test/db/test-database";
import { PrismaClient } from "generated/prisma/client";

import { makeAuthEventRepository } from "../auth-event.repository";

describe("authEventRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;

  beforeAll(async () => {
    container = await getTestDatabase();
    

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
  }, 60000);

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  it("recordSessionIssued: inserts an auth event row", async () => {
    const repo = makeAuthEventRepository(client);
    const userId = "018d4529-6880-77a8-8e6f-4d2c88d22399";
    const occurredAt = new Date("2025-01-01T00:00:00Z");

    await client.user.create({
      data: {
        id: userId,
        fullname: "AuthEvent Test User",
        email: "auth-event-test@example.com",
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });

    await Effect.runPromise(repo.recordSessionIssued({ userId, occurredAt }));

    const rows = await client.authEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: "asc" },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(userId);
    expect(rows[0].occurredAt.toISOString()).toBe(occurredAt.toISOString());

    await client.authEvent.deleteMany({});
    await client.user.deleteMany({ where: { id: userId } });
  });
});
