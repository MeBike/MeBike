import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeRentalRepository } from "../rental.repository";

type RentalRepoClient = PrismaClient | PrismaTypes.TransactionClient;

export function setupRentalRepositoryIntTestKit() {
  const fixture = setupPrismaIntFixture();

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

  return {
    fixture,
    makeRepo: (client: RentalRepoClient = fixture.prisma) =>
      makeRentalRepository(client),
    createUser,
    createBikeGraph,
  };
}
