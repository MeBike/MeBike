import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag } from "@/test/effect/assertions";
import { runEffect, runEffectEither } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeReturnSlotRepository } from "../return-slot.repository";
import { isKnownReturnSlotUniqueConstraint } from "../unique-violation";

describe("returnSlotRepository integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeReturnSlotRepository>;

  beforeAll(() => {
    repo = makeReturnSlotRepository(fixture.prisma);
  });

  it("maps the real active-return-slot unique violation from Prisma", async () => {
    const user = await fixture.factories.user();
    const startStation = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: startStation.id, status: "BOOKED" });
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: startStation.id,
      status: "RENTED",
    });
    const targetStation = await fixture.factories.station();

    await runEffect(repo.createActive({
      rentalId: rental.id,
      userId: user.id,
      stationId: targetStation.id,
      reservedFrom: new Date(),
    }));

    const duplicate = await runEffectEither(repo.createActive({
      rentalId: rental.id,
      userId: user.id,
      stationId: targetStation.id,
      reservedFrom: new Date(),
    }));

    expectLeftTag(duplicate, "ReturnSlotUniqueViolation");
    if (duplicate._tag === "Left" && duplicate.left._tag === "ReturnSlotUniqueViolation") {
      expect(isKnownReturnSlotUniqueConstraint(duplicate.left.constraint)).toBe(true);
    }
  });
});
