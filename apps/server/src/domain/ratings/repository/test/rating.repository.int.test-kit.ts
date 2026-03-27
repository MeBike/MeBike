import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { uuidv7 } from "uuidv7";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeRatingRepository } from "../rating.repository";

type RatingRepoClient = PrismaClient | PrismaTypes.TransactionClient;

export function setupRatingRepositoryIntTestKit() {
  const fixture = setupPrismaIntFixture();

  const createUser = async () => {
    const user = await fixture.factories.user({ fullname: "Rating User" });
    return { id: user.id };
  };

  const createStation = async () => {
    const station = await fixture.factories.station();
    return { id: station.id };
  };

  const createBike = async (stationId: string) => {
    const bike = await fixture.factories.bike({ stationId, status: "AVAILABLE" });
    return { id: bike.id };
  };

  const createRental = async (userId: string, bikeId: string, stationId: string) => {
    const rental = await fixture.factories.rental({
      userId,
      bikeId,
      startStationId: stationId,
      status: "COMPLETED",
    });
    return { id: rental.id };
  };

  const createReason = async (appliesTo: "bike" | "station" = "bike") => {
    const id = uuidv7();
    await fixture.prisma.ratingReason.create({
      data: {
        id,
        type: "ISSUE",
        appliesTo,
        message: `Reason ${id}`,
      },
    });
    return { id };
  };

  return {
    fixture,
    makeRepo: (client: RatingRepoClient = fixture.prisma) =>
      makeRatingRepository(client as PrismaClient),
    createUser,
    createStation,
    createBike,
    createRental,
    createReason,
  };
}
