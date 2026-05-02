import { Effect, Option } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "generated/prisma/client";

import { expectDefect } from "@/test/effect/assertions";

import { PricingPolicyRepositoryError } from "../domain-errors";
import { makePricingPolicyRepository } from "../repository/pricing-policy.repository";

function makePolicy(id: string) {
  return {
    id,
    name: `Policy ${id}`,
    baseRate: 2000n,
    billingUnitMinutes: 30,
    reservationFee: 3000n,
    depositRequired: 500000n,
    lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
    status: "ACTIVE" as const,
    createdAt: new Date("2026-03-22T00:00:00.000Z"),
    updatedAt: new Date("2026-03-22T00:00:00.000Z"),
  };
}

function makeDb() {
  return {
    pricingPolicy: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    reservation: {
      count: vi.fn(),
    },
    rental: {
      count: vi.fn(),
    },
    rentalBillingRecord: {
      count: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe("pricing policy repository", () => {
  it("finds a policy by id", async () => {
    const db = makeDb();
    const policy = makePolicy("policy-a");
    vi.mocked(db.pricingPolicy.findUnique).mockResolvedValue(policy);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(repo.findById(policy.id));

    expect(Option.isSome(result)).toBe(true);
    if (Option.isSome(result)) {
      expect(result.value.id).toBe(policy.id);
    }
  });

  it("returns none when policy id does not exist", async () => {
    const db = makeDb();
    vi.mocked(db.pricingPolicy.findUnique).mockResolvedValue(null);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(repo.findById("missing"));

    expect(Option.isNone(result)).toBe(true);
  });

  it("fails getById when policy is missing", async () => {
    const db = makeDb();
    vi.mocked(db.pricingPolicy.findUnique).mockResolvedValue(null);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(Effect.either(repo.getById("missing")));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("PricingPolicyNotFound");
    }
  });

  it("returns the single active policy", async () => {
    const db = makeDb();
    const policy = makePolicy("policy-a");
    vi.mocked(db.pricingPolicy.findMany).mockResolvedValue([policy]);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(repo.getActive());

    expect(result.id).toBe(policy.id);
  });

  it("fails when there is no active policy", async () => {
    const db = makeDb();
    vi.mocked(db.pricingPolicy.findMany).mockResolvedValue([]);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(Effect.either(repo.getActive()));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ActivePricingPolicyNotFound");
    }
  });

  it("fails when multiple active policies exist", async () => {
    const db = makeDb();
    vi.mocked(db.pricingPolicy.findMany).mockResolvedValue([
      makePolicy("policy-a"),
      makePolicy("policy-b"),
    ]);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(Effect.either(repo.getActive()));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left" && result.left._tag === "ActivePricingPolicyAmbiguous") {
      expect(result.left.pricingPolicyIds).toEqual(["policy-a", "policy-b"]);
    }
  });

  it("lists pricing policies with pagination metadata", async () => {
    const db = makeDb();
    vi.mocked(db.pricingPolicy.findMany).mockResolvedValue([makePolicy("policy-a")]);
    vi.mocked(db.pricingPolicy.count).mockResolvedValue(3);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(repo.listByStatus("ACTIVE", { page: 2, pageSize: 1 }));

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("policy-a");
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(1);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(3);
  });

  it("returns usage summary when a policy has references", async () => {
    const db = makeDb();
    vi.mocked(db.reservation.count).mockResolvedValue(1);
    vi.mocked(db.rental.count).mockResolvedValue(2);
    vi.mocked(db.rentalBillingRecord.count).mockResolvedValue(3);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(repo.getUsageSummary("policy-a"));

    expect(result).toEqual({
      reservationCount: 1,
      rentalCount: 2,
      billingRecordCount: 3,
      isUsed: true,
    });
  });

  it("returns unused usage summary when a policy has no references", async () => {
    const db = makeDb();
    vi.mocked(db.reservation.count).mockResolvedValue(0);
    vi.mocked(db.rental.count).mockResolvedValue(0);
    vi.mocked(db.rentalBillingRecord.count).mockResolvedValue(0);

    const repo = makePricingPolicyRepository(db);
    const result = await Effect.runPromise(repo.getUsageSummary("policy-a"));

    expect(result).toEqual({
      reservationCount: 0,
      rentalCount: 0,
      billingRecordCount: 0,
      isUsed: false,
    });
  });

  it("defects with PricingPolicyRepositoryError when findById query rejects", async () => {
    const db = makeDb();
    vi.mocked(db.pricingPolicy.findUnique).mockRejectedValue(new Error("db down"));

    const repo = makePricingPolicyRepository(db);

    await expectDefect(
      repo.findById("policy-a"),
      PricingPolicyRepositoryError,
      { operation: "pricingPolicy.findById" },
    );
  });

  it("defects with PricingPolicyRepositoryError when getActive query rejects", async () => {
    const db = makeDb();
    vi.mocked(db.pricingPolicy.findMany).mockRejectedValue(new Error("db down"));

    const repo = makePricingPolicyRepository(db);

    await expectDefect(
      repo.getActive(),
      PricingPolicyRepositoryError,
      { operation: "pricingPolicy.getActive" },
    );
  });

  it("defects with PricingPolicyRepositoryError when listByStatus query rejects", async () => {
    const db = makeDb();
    vi.mocked(db.pricingPolicy.findMany).mockRejectedValue(new Error("db down"));

    const repo = makePricingPolicyRepository(db);

    await expectDefect(
      repo.listByStatus("ACTIVE", { page: 1, pageSize: 10 }),
      PricingPolicyRepositoryError,
      { operation: "pricingPolicy.listByStatus" },
    );
  });

  it("defects with PricingPolicyRepositoryError when getUsageSummary query rejects", async () => {
    const db = makeDb();
    vi.mocked(db.reservation.count).mockRejectedValue(new Error("db down"));

    const repo = makePricingPolicyRepository(db);

    await expectDefect(
      repo.getUsageSummary("policy-a"),
      PricingPolicyRepositoryError,
      { operation: "pricingPolicy.getUsageSummary" },
    );
  });
});
