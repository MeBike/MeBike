import { Option } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag } from "@/test/effect/assertions";
import { runEffect, runEffectEither } from "@/test/effect/run";

import { setupRentalRepositoryIntTestKit } from "../rental.repository.int.test-kit";

describe("rentalRepository write integration", () => {
  const kit = setupRentalRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
  });

  it("createRental stores an active rental", async () => {
    const user = await kit.createUser();
    const { station, bike } = await kit.createBikeGraph();

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
    const user = await kit.createUser();
    const { station, bike } = await kit.createBikeGraph();
    const reservation = await kit.fixture.factories.reservation({
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
    const user = await kit.createUser();
    const { station, bike } = await kit.createBikeGraph();

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

  it("createRental rejects active rental duplicates", async () => {
    const user = await kit.createUser();
    const station = await kit.fixture.factories.station();
    const bike = await kit.fixture.factories.bike({ stationId: station.id });
    const otherBike = await kit.fixture.factories.bike({ stationId: station.id });

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
});
