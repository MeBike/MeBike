import { uuidv7 } from "uuidv7";

import type {
  BikeOverrides,
  RentalOverrides,
  ReservationOverrides,
  StationOverrides,
  SupplierOverrides,
  UserOverrides,
  WalletOverrides,
} from "@/test/factories";
import type { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

type PrismaFixture = ReturnType<typeof setupPrismaIntFixture>;

export async function givenUserWithWallet(
  fixture: PrismaFixture,
  overrides: {
    user?: UserOverrides;
    wallet?: Omit<WalletOverrides, "userId">;
  } = {},
) {
  const user = await fixture.factories.user(overrides.user);
  const wallet = await fixture.factories.wallet({
    userId: user.id,
    balance: 0n,
    ...overrides.wallet,
  });

  return { user, wallet };
}

export async function givenStationWithAvailableBike(
  fixture: PrismaFixture,
  overrides: {
    station?: StationOverrides;
    supplier?: SupplierOverrides;
    bike?: Omit<BikeOverrides, "stationId" | "supplierId"> & { supplierId?: string | null };
  } = {},
) {
  const station = await fixture.factories.station(overrides.station);
  const supplier = overrides.bike?.supplierId === null
    ? null
    : await fixture.factories.supplier(overrides.supplier);
  const bike = await fixture.factories.bike({
    stationId: station.id,
    supplierId: overrides.bike?.supplierId ?? supplier?.id ?? null,
    status: "AVAILABLE",
    ...overrides.bike,
  });

  return { station, supplier, bike };
}

export async function givenActiveRental(
  fixture: PrismaFixture,
  overrides: {
    user?: UserOverrides;
    wallet?: Omit<WalletOverrides, "userId">;
    station?: StationOverrides;
    bike?: Omit<BikeOverrides, "stationId">;
    rental?: Omit<RentalOverrides, "userId" | "bikeId" | "startStationId">;
  } = {},
) {
  const { user, wallet } = await givenUserWithWallet(fixture, {
    user: overrides.user,
    wallet: {
      balance: 100000n,
      ...overrides.wallet,
    },
  });
  const station = await fixture.factories.station(overrides.station);
  const bike = await fixture.factories.bike({
    stationId: station.id,
    status: "BOOKED",
    ...overrides.bike,
  });
  const rental = await fixture.factories.rental({
    userId: user.id,
    bikeId: bike.id,
    startStationId: station.id,
    status: "RENTED",
    ...overrides.rental,
  });

  return { user, wallet, station, bike, rental };
}

export async function givenPendingReservation(
  fixture: PrismaFixture,
  overrides: {
    user?: UserOverrides;
    wallet?: Omit<WalletOverrides, "userId">;
    station?: StationOverrides;
    bike?: Omit<BikeOverrides, "stationId">;
    reservation?: Omit<ReservationOverrides, "userId" | "stationId" | "bikeId">;
  } = {},
) {
  const { user, wallet } = await givenUserWithWallet(fixture, {
    user: overrides.user,
    wallet: overrides.wallet,
  });
  const station = await fixture.factories.station(overrides.station);
  const bike = await fixture.factories.bike({
    stationId: station.id,
    status: "RESERVED",
    ...overrides.bike,
  });
  const reservation = await fixture.factories.reservation({
    userId: user.id,
    bikeId: bike.id,
    stationId: station.id,
    status: "PENDING",
    startTime: new Date(),
    endTime: new Date(Date.now() + 10 * 60 * 1000),
    ...overrides.reservation,
  });

  return { user, wallet, station, bike, reservation };
}

export async function givenTechnicianAtStation(
  fixture: PrismaFixture,
  overrides: {
    user?: UserOverrides;
    station?: StationOverrides;
    technicianTeam?: { name?: string };
  } = {},
) {
  const station = await fixture.factories.station(overrides.station);
  const user = await fixture.factories.user({
    role: "TECHNICIAN",
    ...overrides.user,
  });
  const technicianTeam = await fixture.factories.technicianTeam({
    stationId: station.id,
    name: overrides.technicianTeam?.name,
  });
  const assignment = await fixture.factories.userOrgAssignment({
    userId: user.id,
    technicianTeamId: technicianTeam.id,
  });

  return { station, user, technicianTeam, assignment };
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${uuidv7()}@example.com`;
}
