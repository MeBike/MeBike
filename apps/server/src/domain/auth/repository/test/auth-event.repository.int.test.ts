import { Effect } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeAuthEventRepository } from "../auth-event.repository";

describe("authEventRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeAuthEventRepository>;

  beforeAll(() => {
    repo = makeAuthEventRepository(fixture.prisma);
  });

  it("recordSessionIssued: inserts an auth event row", async () => {
    const user = await fixture.factories.user({
      fullname: "AuthEvent Test User",
      email: "auth-event-test@example.com",
    });
    const occurredAt = new Date("2025-01-01T00:00:00Z");

    await Effect.runPromise(repo.recordSessionIssued({ userId: user.id, occurredAt }));

    const rows = await fixture.prisma.authEvent.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "asc" },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(user.id);
    expect(rows[0].occurredAt.toISOString()).toBe(occurredAt.toISOString());
  });
});
