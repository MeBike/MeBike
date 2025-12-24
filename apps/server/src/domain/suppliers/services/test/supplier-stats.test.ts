import { Cause, Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";

import type { BikeStatus } from "generated/prisma/types";

import type { SupplierCountRow, SupplierStatusCountRow } from "../supplier.service";

import {
  buildAllSupplierStats,
  buildSupplierStats,
  emptyStats,
  ensureValidStatus,
  updateStatsWithCount,
} from "../supplier.service";

describe("supplier Stats Utilities", () => {
  describe("emptyStats", () => {
    it("should create empty stats with zero values", () => {
      const result = emptyStats("supplier-123", "Test Supplier");

      expect(result).toEqual({
        supplierId: "supplier-123",
        supplierName: "Test Supplier",
        totalBikes: 0,
        available: 0,
        booked: 0,
        broken: 0,
        reserved: 0,
        maintained: 0,
        unavailable: 0,
      });
    });
  });

  describe("updateStatsWithCount", () => {
    it("should update totalBikes and available count", () => {
      const stats = emptyStats("id", "name");
      const result = updateStatsWithCount(stats, "AVAILABLE" as BikeStatus, 5);

      expect(result.totalBikes).toBe(5);
      expect(result.available).toBe(5);
    });

    it("should update totalBikes and booked count", () => {
      const stats = emptyStats("id", "name");
      const result = updateStatsWithCount(stats, "BOOKED" as BikeStatus, 3);

      expect(result.totalBikes).toBe(3);
      expect(result.booked).toBe(3);
    });

    it("should update totalBikes and broken count", () => {
      const stats = emptyStats("id", "name");
      const result = updateStatsWithCount(stats, "BROKEN" as BikeStatus, 2);

      expect(result.totalBikes).toBe(2);
      expect(result.broken).toBe(2);
    });

    it("should update totalBikes and reserved count", () => {
      const stats = emptyStats("id", "name");
      const result = updateStatsWithCount(stats, "RESERVED" as BikeStatus, 1);

      expect(result.totalBikes).toBe(1);
      expect(result.reserved).toBe(1);
    });

    it("should update totalBikes and maintained count", () => {
      const stats = emptyStats("id", "name");
      const result = updateStatsWithCount(stats, "MAINTAINED" as BikeStatus, 4);

      expect(result.totalBikes).toBe(4);
      expect(result.maintained).toBe(4);
    });

    it("should update totalBikes and unavailable count", () => {
      const stats = emptyStats("id", "name");
      const result = updateStatsWithCount(stats, "UNAVAILABLE" as BikeStatus, 2);

      expect(result.totalBikes).toBe(2);
      expect(result.unavailable).toBe(2);
    });

    it("should accumulate counts when called multiple times", () => {
      let stats = emptyStats("id", "name");
      stats = updateStatsWithCount(stats, "AVAILABLE" as BikeStatus, 5);
      stats = updateStatsWithCount(stats, "BOOKED" as BikeStatus, 3);
      stats = updateStatsWithCount(stats, "BROKEN" as BikeStatus, 2);

      expect(stats.totalBikes).toBe(10);
      expect(stats.available).toBe(5);
      expect(stats.booked).toBe(3);
      expect(stats.broken).toBe(2);
    });
  });

  describe("buildAllSupplierStats", () => {
    it("should build stats for all suppliers with counts", () => {
      const suppliers = [
        { id: "s1", name: "Supplier 1" },
        { id: "s2", name: "Supplier 2" },
      ];

      const counts: SupplierCountRow[] = [
        { supplierId: "s1", status: "AVAILABLE" as BikeStatus, count: 5 },
        { supplierId: "s1", status: "BOOKED" as BikeStatus, count: 3 },
        { supplierId: "s2", status: "AVAILABLE" as BikeStatus, count: 2 },
        { supplierId: "s2", status: "BROKEN" as BikeStatus, count: 1 },
      ];

      const result = buildAllSupplierStats(suppliers, counts);

      expect(result).toHaveLength(2);

      const s1Stats = result.find(s => s.supplierId === "s1");
      expect(s1Stats).toEqual({
        supplierId: "s1",
        supplierName: "Supplier 1",
        totalBikes: 8,
        available: 5,
        booked: 3,
        broken: 0,
        reserved: 0,
        maintained: 0,
        unavailable: 0,
      });

      const s2Stats = result.find(s => s.supplierId === "s2");
      expect(s2Stats).toEqual({
        supplierId: "s2",
        supplierName: "Supplier 2",
        totalBikes: 3,
        available: 2,
        booked: 0,
        broken: 1,
        reserved: 0,
        maintained: 0,
        unavailable: 0,
      });
    });

    it("should handle suppliers with no bikes", () => {
      const suppliers = [
        { id: "s1", name: "Supplier 1" },
        { id: "s2", name: "Supplier 2" },
      ];

      const counts: SupplierCountRow[] = [
        { supplierId: "s1", status: "AVAILABLE" as BikeStatus, count: 5 },
      ];

      const result = buildAllSupplierStats(suppliers, counts);

      expect(result).toHaveLength(2);

      const s1Stats = result.find(s => s.supplierId === "s1");
      expect(s1Stats?.totalBikes).toBe(5);

      const s2Stats = result.find(s => s.supplierId === "s2");
      expect(s2Stats?.totalBikes).toBe(0);
    });

    it("should ignore counts with null supplierId", () => {
      const suppliers = [
        { id: "s1", name: "Supplier 1" },
      ];

      const counts: SupplierCountRow[] = [
        { supplierId: null, status: "AVAILABLE" as BikeStatus, count: 5 },
        { supplierId: "s1", status: "BOOKED" as BikeStatus, count: 3 },
      ];

      const result = buildAllSupplierStats(suppliers, counts);

      expect(result).toHaveLength(1);
      const s1Stats = result[0];
      expect(s1Stats.totalBikes).toBe(3);
      expect(s1Stats.booked).toBe(3);
      expect(s1Stats.available).toBe(0);
    });

    it("should ignore counts for unknown suppliers", () => {
      const suppliers = [
        { id: "s1", name: "Supplier 1" },
      ];

      const counts: SupplierCountRow[] = [
        { supplierId: "s2", status: "AVAILABLE" as BikeStatus, count: 5 },
        { supplierId: "s1", status: "BOOKED" as BikeStatus, count: 3 },
      ];

      const result = buildAllSupplierStats(suppliers, counts);

      expect(result).toHaveLength(1);
      const s1Stats = result[0];
      expect(s1Stats.totalBikes).toBe(3);
      expect(s1Stats.booked).toBe(3);
    });
  });

  describe("buildSupplierStats", () => {
    it("should build stats for a single supplier", () => {
      const counts: SupplierStatusCountRow[] = [
        { status: "AVAILABLE" as BikeStatus, count: 5 },
        { status: "BOOKED" as BikeStatus, count: 3 },
        { status: "BROKEN" as BikeStatus, count: 2 },
        { status: "RESERVED" as BikeStatus, count: 1 },
        { status: "MAINTAINED" as BikeStatus, count: 4 },
        { status: "UNAVAILABLE" as BikeStatus, count: 2 },
      ];

      const result = buildSupplierStats("s1", "Supplier 1", counts);

      expect(result).toEqual({
        supplierId: "s1",
        supplierName: "Supplier 1",
        totalBikes: 17,
        available: 5,
        booked: 3,
        broken: 2,
        reserved: 1,
        maintained: 4,
        unavailable: 2,
      });
    });

    it("should handle empty counts", () => {
      const counts: SupplierStatusCountRow[] = [];
      const result = buildSupplierStats("s1", "Supplier 1", counts);

      expect(result).toEqual({
        supplierId: "s1",
        supplierName: "Supplier 1",
        totalBikes: 0,
        available: 0,
        booked: 0,
        broken: 0,
        reserved: 0,
        maintained: 0,
        unavailable: 0,
      });
    });

    it("should handle duplicate status entries", () => {
      const counts: SupplierStatusCountRow[] = [
        { status: "AVAILABLE" as BikeStatus, count: 3 },
        { status: "AVAILABLE" as BikeStatus, count: 2 },
        { status: "BOOKED" as BikeStatus, count: 1 },
      ];

      const result = buildSupplierStats("s1", "Supplier 1", counts);

      // Each update adds to the total, with later updates overwriting status-specific counts
      expect(result).toEqual({
        supplierId: "s1",
        supplierName: "Supplier 1",
        totalBikes: 6, // 3 (first AVAILABLE) + 2 (second AVAILABLE) + 1 (BOOKED)
        available: 2, // Last AVAILABLE count
        booked: 1,
        broken: 0,
        reserved: 0,
        maintained: 0,
        unavailable: 0,
      });
    });
  });
});

describe("ensureValidStatus", () => {
  it("should return success for undefined status", async () => {
    const result = await Effect.runPromise(ensureValidStatus(undefined));
    expect(result).toBeUndefined();
  });

  it("should return success for ACTIVE status", async () => {
    const result = await Effect.runPromise(ensureValidStatus("ACTIVE"));
    expect(result).toBeUndefined();
  });

  it("should return success for INACTIVE status", async () => {
    const result = await Effect.runPromise(ensureValidStatus("INACTIVE"));
    expect(result).toBeUndefined();
  });

  it("should return success for TERMINATED status", async () => {
    const result = await Effect.runPromise(ensureValidStatus("TERMINATED"));
    expect(result).toBeUndefined();
  });

  it("should return failure for invalid status", async () => {
    const result = await Effect.runPromiseExit(
      ensureValidStatus("INVALID_STATUS" as any),
    );

    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
      expect(result.cause.error._tag).toBe("InvalidSupplierStatus");
      expect(result.cause.error.status).toBe("INVALID_STATUS");
      expect(result.cause.error.allowed).toEqual(["ACTIVE", "INACTIVE", "TERMINATED"]);
    }
  });

  it("should return failure for null status", async () => {
    const result = await Effect.runPromiseExit(
      ensureValidStatus(null as any),
    );

    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
      expect(result.cause.error._tag).toBe("InvalidSupplierStatus");
      expect(result.cause.error.status).toBe(null);
      expect(result.cause.error.allowed).toEqual(["ACTIVE", "INACTIVE", "TERMINATED"]);
    }
  });
});
