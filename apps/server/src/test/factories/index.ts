import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { resetTestData } from "@/test/db/reset";
import { seedDefaultPricingPolicy } from "@/test/db/seed-pricing-policy";
import { PrismaClient } from "generated/prisma/client";

import type { BikeFactory } from "./bike.factory";
import type { PricingPolicyFactory } from "./pricing-policy.factory";
import type { PushTokenFactory } from "./push-token.factory";
import type { RentalFactory } from "./rental.factory";
import type { ReservationFactory } from "./reservation.factory";
import type { StationFactory } from "./station.factory";
import type { SubscriptionFactory } from "./subscription.factory";
import type { SupplierFactory } from "./supplier.factory";
import type { TechnicianTeamFactory } from "./technician-team.factory";
import type {
  CreatedBike,
  CreatedPricingPolicy,
  CreatedPushToken,
  CreatedRental,
  CreatedReservation,
  CreatedStation,
  CreatedSubscription,
  CreatedSupplier,
  CreatedTechnicianTeam,
  CreatedUser,
  CreatedUserOrgAssignment,
  CreatedWallet,
  FactoryContext,
} from "./types";
import type { UserOrgAssignmentFactory } from "./user-org-assignment.factory";
import type { UserFactory } from "./user.factory";
import type { WalletFactory } from "./wallet.factory";

import { createBikeFactory } from "./bike.factory";
import { createPricingPolicyFactory } from "./pricing-policy.factory";
import { createPushTokenFactory } from "./push-token.factory";
import { createRentalFactory } from "./rental.factory";
import { createReservationFactory } from "./reservation.factory";
import { createStationFactory } from "./station.factory";
import { createSubscriptionFactory } from "./subscription.factory";
import { createSupplierFactory } from "./supplier.factory";
import { createTechnicianTeamFactory } from "./technician-team.factory";
import { createUserOrgAssignmentFactory } from "./user-org-assignment.factory";
import { createUserFactory } from "./user.factory";
import { createWalletFactory } from "./wallet.factory";

export type {
  CreatedBike,
  CreatedPricingPolicy,
  CreatedPushToken,
  CreatedRental,
  CreatedReservation,
  CreatedStation,
  CreatedSubscription,
  CreatedSupplier,
  CreatedTechnicianTeam,
  CreatedUser,
  CreatedUserOrgAssignment,
  CreatedWallet,
};
export type {
  BikeOverrides,
  PricingPolicyOverrides,
  PushTokenOverrides,
  RentalOverrides,
  ReservationOverrides,
  StationOverrides,
  SubscriptionOverrides,
  SupplierOverrides,
  TechnicianTeamOverrides,
  UserOrgAssignmentOverrides,
  UserOverrides,
  WalletOverrides,
} from "./types";

export type TestFactories = {
  user: UserFactory;
  station: StationFactory;
  bike: BikeFactory;
  supplier: SupplierFactory;
  rental: RentalFactory;
  reservation: ReservationFactory;
  subscription: SubscriptionFactory;
  technicianTeam: TechnicianTeamFactory;
  userOrgAssignment: UserOrgAssignmentFactory;
  pricingPolicy: PricingPolicyFactory;
  pushToken: PushTokenFactory;
  wallet: WalletFactory;
};

export type FactorySetup = {
  factories: TestFactories;
  prisma: PrismaClient;
  container: { stop: () => Promise<void>; url: string };
};

export function createTestFactories(ctx: FactoryContext): TestFactories {
  return {
    user: createUserFactory(ctx),
    station: createStationFactory(ctx),
    bike: createBikeFactory(ctx),
    supplier: createSupplierFactory(ctx),
    rental: createRentalFactory(ctx),
    reservation: createReservationFactory(ctx),
    subscription: createSubscriptionFactory(ctx),
    technicianTeam: createTechnicianTeamFactory(ctx),
    userOrgAssignment: createUserOrgAssignmentFactory(ctx),
    pushToken: createPushTokenFactory(ctx),
    pricingPolicy: createPricingPolicyFactory(ctx),
    wallet: createWalletFactory(ctx),
  };
}

export function setupFactories(): FactorySetup {
  let container: { stop: () => Promise<void>; url: string };
  let prisma: PrismaClient;
  let factories: TestFactories;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    prisma = new PrismaClient({ adapter });

    factories = createTestFactories({ prisma });
  }, 60000);

  beforeEach(async () => {
    await resetTestData(prisma);
    await seedDefaultPricingPolicy(prisma);
  });

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
