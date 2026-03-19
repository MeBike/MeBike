import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, afterEach, beforeAll } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { resetTestData } from "@/test/db/reset";
import { PrismaClient } from "generated/prisma/client";

import type { BikeFactory } from "./bike.factory";
import type { RentalFactory } from "./rental.factory";
import type { StationFactory } from "./station.factory";
import type { CreatedBike, CreatedRental, CreatedStation, CreatedUser, CreatedWallet } from "./types";
import type { UserFactory } from "./user.factory";
import type { WalletFactory } from "./wallet.factory";

import { createBikeFactory } from "./bike.factory";
import { createRentalFactory } from "./rental.factory";
import { createStationFactory } from "./station.factory";
import { createUserFactory } from "./user.factory";
import { createWalletFactory } from "./wallet.factory";

export type { CreatedBike, CreatedRental, CreatedStation, CreatedUser, CreatedWallet };
export type { BikeOverrides, RentalOverrides, StationOverrides, UserOverrides, WalletOverrides } from "./types";

export type TestFactories = {
  user: UserFactory;
  station: StationFactory;
  bike: BikeFactory;
  rental: RentalFactory;
  wallet: WalletFactory;
};

export type FactorySetup = {
  factories: TestFactories;
  prisma: PrismaClient;
  container: { stop: () => Promise<void>; url: string };
};

export function setupFactories(): FactorySetup {
  let container: { stop: () => Promise<void>; url: string };
  let prisma: PrismaClient;
  let factories: TestFactories;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    prisma = new PrismaClient({ adapter });

    factories = {
      user: createUserFactory({ prisma }),
      station: createStationFactory({ prisma }),
      bike: createBikeFactory({ prisma }),
      rental: createRentalFactory({ prisma }),
      wallet: createWalletFactory({ prisma }),
    };
  }, 60000);

  afterEach(async () => {
    await resetTestData(prisma);
  });

  afterAll(async () => {
    if (prisma)
      await prisma.$disconnect();
    if (container)
      await container.stop();
  });

  return {
    get factories() { return factories; },
    get prisma() { return prisma; },
    get container() { return container; },
  };
}
