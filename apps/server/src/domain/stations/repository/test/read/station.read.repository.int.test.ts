import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";

import { setupStationRepositoryIntTestKit } from "../station.repository.int.test-kit";

describe("stationReadRepository Integration", () => {
  const kit = setupStationRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
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

  it("returns StationRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = kit.makeRepo(broken.client);

      const result = await Effect.runPromise(
        brokenRepo.listWithOffset({}, { page: 1, pageSize: 10 }).pipe(Effect.either),
      );

      if (Either.isRight(result)) {
        throw new Error("Expected failure but got success");
      }

      expect(result.left._tag).toBe("StationRepositoryError");
    }
    finally {
      await broken.stop();
    }
  });
});
