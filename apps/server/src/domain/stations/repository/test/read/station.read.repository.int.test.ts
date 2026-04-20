import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { StationRepositoryError } from "@/domain/stations/errors";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectDefect } from "@/test/effect/assertions";

import { setupStationRepositoryIntTestKit } from "../station.repository.int.test-kit";

describe("stationReadRepository Integration", () => {
  const kit = setupStationRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeQueryRepo>;

  beforeAll(() => {
    repo = kit.makeQueryRepo();
  });

  it("listWithOffset returns stations", async () => {
    await kit.createStation({ name: "Station A", latitude: 10.0, longitude: 106.0 });
    await kit.createStation({ name: "Station B", latitude: 11.0, longitude: 107.0 });

    const result = await Effect.runPromise(
      repo.listWithOffset({}, { page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("listWithOffset excludes stations with assigned staff when requested", async () => {
    const availableStation = await kit.fixture.factories.station({ name: "Unassigned Station" });
    const assignedStation = await kit.fixture.factories.station({ name: "Assigned Station" });
    const technicianStation = await kit.fixture.factories.station({ name: "Technician Station" });

    const staff = await kit.fixture.factories.user({
      fullname: "Assigned Staff",
      email: "assigned-staff@test.example.com",
      role: "STAFF",
    });
    const technician = await kit.fixture.factories.user({
      fullname: "Assigned Technician",
      email: "assigned-technician@test.example.com",
      role: "TECHNICIAN",
    });

    await kit.fixture.factories.userOrgAssignment({
      userId: staff.id,
      stationId: assignedStation.id,
    });
    await kit.fixture.factories.userOrgAssignment({
      userId: technician.id,
      stationId: technicianStation.id,
    });

    const result = await Effect.runPromise(
      repo.listWithOffset({ excludeAssignedStaff: true }, { page: 1, pageSize: 10 }),
    );

    expect(result.items.map(item => item.id)).toContain(availableStation.id);
    expect(result.items.map(item => item.id)).toContain(technicianStation.id);
    expect(result.items.map(item => item.id)).not.toContain(assignedStation.id);
  });

  it("getById returns Option.none for missing station", async () => {
    const result = await Effect.runPromise(repo.getById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("listNearest orders stations by distance", async () => {
    const { id: nearId } = await kit.createStation({
      name: "Near Station",
      latitude: 10.0,
      longitude: 106.0,
    });
    const { id: farId } = await kit.createStation({
      name: "Far Station",
      latitude: 10.001,
      longitude: 106.001,
    });

    const result = await Effect.runPromise(
      repo.listNearest({
        latitude: 10.0,
        longitude: 106.0,
        maxDistanceMeters: 500,
        page: 1,
        pageSize: 10,
      }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe(nearId);
    expect(result.items[1].id).toBe(farId);
  });

  it("getRevenueByStation aggregates completed rental revenue by start station", async () => {
    const stationA = await kit.fixture.factories.station({ name: "Revenue Station A" });
    const stationB = await kit.fixture.factories.station({ name: "Revenue Station B" });
    const bikeA = await kit.fixture.factories.bike({ stationId: stationA.id });
    const bikeB = await kit.fixture.factories.bike({ stationId: stationB.id });
    const userA = await kit.fixture.factories.user({ email: "revenue-user-a@example.com" });
    const userB = await kit.fixture.factories.user({ email: "revenue-user-b@example.com" });
    const from = new Date("2026-02-01T00:00:00.000Z");
    const to = new Date("2026-02-28T23:59:59.999Z");

    await kit.fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-05T09:00:00.000Z"),
      endTime: new Date("2026-02-05T09:30:00.000Z"),
      duration: 30,
      totalPrice: "10000",
      status: "COMPLETED",
    });
    await kit.fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-10T09:00:00.000Z"),
      endTime: new Date("2026-02-10T10:00:00.000Z"),
      duration: 60,
      totalPrice: "20000",
      status: "COMPLETED",
    });
    await kit.fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: stationB.id,
      startTime: new Date("2026-02-12T09:00:00.000Z"),
      endTime: new Date("2026-02-12T09:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });
    const result = await Effect.runPromise(repo.getRevenueByStation({ from, to }));

    expect(result).toHaveLength(2);

    const stationARow = result.find(item => item.stationId === stationA.id);
    const stationBRow = result.find(item => item.stationId === stationB.id);

    expect(stationARow).toMatchObject({
      stationId: stationA.id,
      name: "Revenue Station A",
      totalRentals: 2,
      totalRevenue: 30000,
      totalDuration: 90,
      avgDuration: 45,
    });
    expect(stationBRow).toMatchObject({
      stationId: stationB.id,
      name: "Revenue Station B",
      totalRentals: 1,
      totalRevenue: 5000,
      totalDuration: 20,
      avgDuration: 20,
    });
  });

  it("defects with StationRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = kit.makeQueryRepo(broken.client);

      await expectDefect(
        brokenRepo.listWithOffset({}, { page: 1, pageSize: 10 }),
        StationRepositoryError,
        { operation: "listWithOffset.count" },
      );
    }
    finally {
      await broken.stop();
    }
  });
});
