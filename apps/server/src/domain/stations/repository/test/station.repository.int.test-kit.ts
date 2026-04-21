import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeStationAnalyticsRepository } from "../station-analytics.repository";
import { makeStationCommandRepository } from "../station-command.repository";
import { makeStationQueryRepository } from "../station-query.repository";

type StationRepoClient = PrismaClient | PrismaTypes.TransactionClient;

export const vietnamCoords = {
  latitude: 21.37481197044971,
  longitude: 104.84103211277719,
};

export const australiaCoords = {
  latitude: -19.88806511187122,
  longitude: 120.81014790361665,
};

export function setupStationRepositoryIntTestKit() {
  const fixture = setupPrismaIntFixture({
    seedData: async ({ prisma }) => {
      await prisma.$executeRaw`
        INSERT INTO "GeoBoundary" ("code", "geom")
        VALUES (
          'VN',
          ST_Multi(
            ST_GeomFromText(
              'POLYGON((102 8, 110.5 8, 110.5 23.5, 102 23.5, 102 8))',
              4326
            )
          )::geometry(MultiPolygon, 4326)
        )
        ON CONFLICT ("code") DO UPDATE
          SET "geom" = EXCLUDED."geom"
      `;
    },
  });

  const createStation = async (args: {
    name: string;
    latitude: number;
    longitude: number;
  }) => {
    const station = await fixture.factories.station(args);
    return { id: station.id };
  };

  return {
    fixture,
    makeQueryRepo: (client: StationRepoClient = fixture.prisma) =>
      makeStationQueryRepository(client),
    makeAnalyticsRepo: (client: StationRepoClient = fixture.prisma) =>
      makeStationAnalyticsRepository(client),
    makeCommandRepo: (client: StationRepoClient = fixture.prisma) =>
      makeStationCommandRepository(client),
    createStation,
  };
}
