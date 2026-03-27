import { Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectLeftTag } from "@/test/effect/assertions";
import { runEffectEither } from "@/test/effect/run";

import { setupRentalRepositoryIntTestKit } from "../rental.repository.int.test-kit";

describe("rentalRepository read integration", () => {
  const kit = setupRentalRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
  });

  it("adminListRentals returns filtered results with user summary", async () => {
    const user = await kit.createUser();
    const otherUser = await kit.createUser();
    const station = await kit.fixture.factories.station();
    const bike = await kit.fixture.factories.bike({ stationId: station.id });
    const otherBike = await kit.fixture.factories.bike({ stationId: station.id });

    await repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    await repo.createRental({
      userId: otherUser.id,
      bikeId: otherBike.id,
      startStationId: station.id,
      startTime: new Date(),
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    const page = await repo.adminListRentals({ userId: user.id }, {
      page: 1,
      pageSize: 10,
      sortBy: "startTime",
      sortDir: "desc",
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].user.id).toBe(user.id);
  });

  it("adminGetRentalById returns detailed rental data", async () => {
    const user = await kit.createUser();
    const { station, bike } = await kit.createBikeGraph();

    const rental = await repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    const detailOpt = await repo.adminGetRentalById(rental.id).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    if (Option.isNone(detailOpt)) {
      throw new Error("Expected rental detail");
    }

    expect(detailOpt.value.id).toBe(rental.id);
    expect(detailOpt.value.user.id).toBe(user.id);
    expect(detailOpt.value.user.email).toBe(user.email);
    expect(detailOpt.value.bike?.id).toBe(bike.id);
    expect(detailOpt.value.startStation.id).toBe(station.id);
  });

  it("listActiveRentalsByPhone returns active rentals for user phone", async () => {
    const phoneNumber = "0901234567";
    const user = await kit.createUser({ phoneNumber, fullname: "Phone User" });
    const otherUser = await kit.createUser({ phoneNumber: "0909999999" });
    const station = await kit.fixture.factories.station();
    const bike = await kit.fixture.factories.bike({ stationId: station.id });
    const bikeTwo = await kit.fixture.factories.bike({ stationId: station.id });
    const otherBike = await kit.fixture.factories.bike({ stationId: station.id });

    const rentalToComplete = await repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    await repo.updateRentalOnEnd({
      rentalId: rentalToComplete.id,
      endStationId: station.id,
      endTime: new Date(),
      durationMinutes: 10,
      totalPrice: 500,
      newStatus: "COMPLETED",
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    const rental = await repo.createRental({
      userId: user.id,
      bikeId: bikeTwo.id,
      startStationId: station.id,
      startTime: new Date(),
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    await repo.createRental({
      userId: otherUser.id,
      bikeId: otherBike.id,
      startStationId: station.id,
      startTime: new Date(),
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    const page = await repo.listActiveRentalsByPhone(phoneNumber, {
      page: 1,
      pageSize: 10,
      sortBy: "startTime",
      sortDir: "desc",
    }).pipe(runEffectEither).then((result) => {
      if (result._tag === "Left")
        throw result.left;
      return result.right;
    });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(rental.id);
    expect(page.items[0].user.id).toBe(user.id);
    expect(page.items[0].status).toBe("RENTED");
  });

  it("returns RentalRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = kit.makeRepo(broken.client);

      const result = await runEffectEither(brokenRepo.findById(uuidv7()));

      expectLeftTag(result, "RentalRepositoryError");
    }
    finally {
      await broken.stop();
    }
  });
});
