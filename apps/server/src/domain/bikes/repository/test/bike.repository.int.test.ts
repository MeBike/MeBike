import { Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectDefect } from "@/test/effect/assertions";
import { runEffect } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { BikeRepositoryError } from "../../domain-errors";
import { makeBikeRepository } from "../bike.repository";

describe("bikeRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeBikeRepository>;

  beforeAll(() => {
    repo = makeBikeRepository(fixture.prisma);
  });

  it("getById returns the bike", async () => {
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });

    const result = await runEffect(repo.getById(bike.id));
    if (Option.isNone(result)) {
      throw new Error("Expected bike to exist");
    }

    expect(result.value.id).toBe(bike.id);
  });

  it("create inserts a bike", async () => {
    const station = await fixture.factories.station();
    const supplier = await fixture.factories.supplier();

    const created = await runEffect(
      repo.create({
        stationId: station.id,
        supplierId: supplier.id,
        status: "AVAILABLE",
      }),
    );

    expect(created.stationId).toBe(station.id);
    expect(created.supplierId).toBe(supplier.id);
    expect(created.status).toBe("AVAILABLE");
  });

  it("create generates a unique bikeNumber", async () => {
    const station = await fixture.factories.station();
    const supplier = await fixture.factories.supplier();

    const first = await runEffect(
      repo.create({
        stationId: station.id,
        supplierId: supplier.id,
        status: "AVAILABLE",
      }),
    );

    const second = await runEffect(
      repo.create({
        stationId: station.id,
        supplierId: supplier.id,
        status: "AVAILABLE",
      }),
    );

    expect(first.bikeNumber).toMatch(/^MB-\d{6}$/);
    expect(second.bikeNumber).toMatch(/^MB-\d{6}$/);
    expect(first.bikeNumber).not.toBe(second.bikeNumber);
  });

  it("getById returns Option.none for missing bike", async () => {
    const result = await runEffect(repo.getById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("listByStationWithOffset returns bikes for station", async () => {
    const station = await fixture.factories.station();
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    await fixture.factories.bike({ stationId: station.id, status: "BOOKED" });

    const result = await runEffect(
      repo.listByStationWithOffset(station.id, {}, { page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("updateStatus updates the bike status", async () => {
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const result = await runEffect(repo.updateStatus(bike.id, "BOOKED"));
    if (Option.isNone(result)) {
      throw new Error("Expected bike to be updated");
    }

    expect(result.value.status).toBe("BOOKED");
  });

  it("updateStatus returns Option.none for missing bike", async () => {
    const result = await runEffect(repo.updateStatus(uuidv7(), "BOOKED"));
    expect(Option.isNone(result)).toBe(true);
  });

  it("reserveBikeIfAvailableInTx marks available bike as reserved", async () => {
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const now = new Date();

    const reserved = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeBikeRepository(tx);
      return runEffect(txRepo.reserveBikeIfAvailable(bike.id, now));
    });

    expect(reserved).toBe(true);

    const updated = await runEffect(repo.getById(bike.id));
    if (Option.isNone(updated)) {
      throw new Error("Expected bike to exist");
    }

    expect(updated.value.status).toBe("RESERVED");
  });

  it("bookBikeIfReservedInTx marks reserved bike as booked", async () => {
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "RESERVED" });
    const now = new Date();

    const booked = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeBikeRepository(tx);
      return runEffect(txRepo.bookBikeIfReserved(bike.id, now));
    });

    expect(booked).toBe(true);

    const updated = await runEffect(repo.getById(bike.id));
    if (Option.isNone(updated)) {
      throw new Error("Expected bike to exist");
    }

    expect(updated.value.status).toBe("BOOKED");
  });

  it("releaseBikeIfReservedInTx marks reserved bike as available", async () => {
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "RESERVED" });
    const now = new Date();

    const released = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeBikeRepository(tx);
      return runEffect(txRepo.releaseBikeIfReserved(bike.id, now));
    });

    expect(released).toBe(true);

    const updated = await runEffect(repo.getById(bike.id));
    if (Option.isNone(updated)) {
      throw new Error("Expected bike to exist");
    }

    expect(updated.value.status).toBe("AVAILABLE");
  });

  it("defects with BikeRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = makeBikeRepository(broken.client);

      await expectDefect(brokenRepo.getById(uuidv7()), BikeRepositoryError);
    }
    finally {
      await broken.stop();
    }
  });
});
