import { Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectLeftTag } from "@/test/effect/assertions";
import { runEffect, runEffectEither } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeRentalRepository } from "../rental.repository";

describe("rentalRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeRentalRepository>;

  beforeAll(() => {
    repo = makeRentalRepository(fixture.prisma);
  });

  const createUser = (options?: { phoneNumber?: string; fullname?: string }) =>
    fixture.factories.user({
      phoneNumber: options?.phoneNumber,
      fullname: options?.fullname ?? "Rental User",
    });

  const createBikeGraph = async () => {
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    return { station, bike };
  };

  it("createRental stores an active rental", async () => {
    const user = await createUser();
    const { station, bike } = await createBikeGraph();

    const rental = await runEffect(repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    expect(rental.status).toBe("RENTED");
    expect(rental.userId).toBe(user.id);

    const active = await runEffect(repo.findActiveByUserId(user.id));
    if (Option.isNone(active)) {
      throw new Error("Expected active rental");
    }
    expect(active.value.id).toBe(rental.id);

    const list = await runEffect(repo.listMyCurrentRentals(user.id, { page: 1, pageSize: 10 }));
    expect(list.items).toHaveLength(1);
  });

  it("createRental stores reservationId when linked to a reservation", async () => {
    const user = await createUser();
    const { station, bike } = await createBikeGraph();
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      status: "FULFILLED",
    });
    const startTime = new Date();

    const rental = await runEffect(repo.createRental({
      userId: user.id,
      reservationId: reservation.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime,
      subscriptionId: null,
    }));

    expect(rental.status).toBe("RENTED");
    expect(rental.reservationId).toBe(reservation.id);

    const found = await runEffect(repo.findById(rental.id));
    if (Option.isNone(found)) {
      throw new Error("Expected rental to exist");
    }
    expect(found.value.reservationId).toBe(reservation.id);
  });

  it("updateRentalOnEnd marks rental completed", async () => {
    const user = await createUser();
    const { station, bike } = await createBikeGraph();

    const rental = await runEffect(repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    const updated = await runEffect(repo.updateRentalOnEnd({
      rentalId: rental.id,
      endStationId: station.id,
      endTime: new Date(),
      durationMinutes: 15,
      totalPrice: 1000,
      newStatus: "COMPLETED",
    }));

    if (Option.isNone(updated)) {
      throw new Error("Expected rental to be updated");
    }
    expect(updated.value.status).toBe("COMPLETED");
    expect(updated.value.totalPrice).toBe(1000);

    const found = await runEffect(repo.findById(rental.id));
    if (Option.isNone(found)) {
      throw new Error("Expected rental to exist");
    }
    expect(found.value.status).toBe("COMPLETED");
  });

  it("adminListRentals returns filtered results with user summary", async () => {
    const user = await createUser();
    const otherUser = await createUser();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    const otherBike = await fixture.factories.bike({ stationId: station.id });

    await runEffect(repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    await runEffect(repo.createRental({
      userId: otherUser.id,
      bikeId: otherBike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    const page = await runEffect(repo.adminListRentals({ userId: user.id }, {
      page: 1,
      pageSize: 10,
      sortBy: "startTime",
      sortDir: "desc",
    }));

    expect(page.items).toHaveLength(1);
    expect(page.items[0].user.id).toBe(user.id);
  });

  it("adminGetRentalById returns detailed rental data", async () => {
    const user = await createUser();
    const { station, bike } = await createBikeGraph();

    const rental = await runEffect(repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    const detailOpt = await runEffect(repo.adminGetRentalById(rental.id));

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
    const user = await createUser({ phoneNumber, fullname: "Phone User" });
    const otherUser = await createUser({ phoneNumber: "0909999999" });
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    const bikeTwo = await fixture.factories.bike({ stationId: station.id });
    const otherBike = await fixture.factories.bike({ stationId: station.id });

    const rentalToComplete = await runEffect(repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    await runEffect(repo.updateRentalOnEnd({
      rentalId: rentalToComplete.id,
      endStationId: station.id,
      endTime: new Date(),
      durationMinutes: 10,
      totalPrice: 500,
      newStatus: "COMPLETED",
    }));

    const rental = await runEffect(repo.createRental({
      userId: user.id,
      bikeId: bikeTwo.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    await runEffect(repo.createRental({
      userId: otherUser.id,
      bikeId: otherBike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    const page = await runEffect(repo.listActiveRentalsByPhone(phoneNumber, {
      page: 1,
      pageSize: 10,
      sortBy: "startTime",
      sortDir: "desc",
    }));

    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(rental.id);
    expect(page.items[0].user.id).toBe(user.id);
    expect(page.items[0].status).toBe("RENTED");
  });

  it("createRental rejects active rental duplicates", async () => {
    const user = await createUser();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    const otherBike = await fixture.factories.bike({ stationId: station.id });

    await runEffect(repo.createRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    const result = await runEffectEither(repo.createRental({
      userId: user.id,
      bikeId: otherBike.id,
      startStationId: station.id,
      startTime: new Date(),
    }));

    expectLeftTag(result, "RentalUniqueViolation");
  });

  it("returns RentalRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = makeRentalRepository(broken.client);

      const result = await runEffectEither(brokenRepo.findById(uuidv7()));

      expectLeftTag(result, "RentalRepositoryError");
    }
    finally {
      await broken.stop();
    }
  });
});
