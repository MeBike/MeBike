import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import {
  AccountStatus,
  AssignmentStatus,
  BikeStatus,
  BikeSwapStatus,
  ConfirmationMethod,
  HandoverStatus,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  PrismaClient,
  RentalStatus,
  ReservationOption,
  ReservationStatus,
  SubscriptionPackage,
  SubscriptionStatus,
  SupplierStatus,
  UserRole,
  UserVerifyStatus,
  WalletStatus,
} from "../generated/prisma/client";
import { setBikeNumberSequence } from "../src/domain/bikes/repository/bike.repository.shared";
import { toPrismaDecimal } from "../src/domain/shared/decimal";
import logger from "../src/lib/logger";
import { upsertVietnamBoundary } from "./seed-geo-boundary";
import { seedDefaultPricingPolicy } from "./seed-pricing-policy";
import { buildDemoCustomerFullName, buildDemoTechnicianFullName } from "./seed/demo-faker";
import { seedDemoRatings } from "./seed/demo-ratings";
import { seedRatingReasons } from "./seed/rating-reasons";
import { STATION_IDS } from "./seed/station-ids";
import { stations } from "./seed/stations.data";

const DEMO_PASSWORD = "Demo@123456";

const USERS_TARGET = 32;
const RENTALS_TARGET = 120;
const DEMO_NON_CUSTOMER_USERS = 7;

const DEMO_AGENCY_MAIN_ID = "019b17bd-d130-7e7d-be69-91ceef7b9003";
const DEMO_AGENCY_EAST_ID = "019b17bd-d130-7e7d-be69-91ceef7b9004";
const LEGACY_DEMO_AGENCY_IDS = [
  "019b17bd-d130-7e7d-be69-91ceef7b9007",
  "019b17bd-d130-7e7d-be69-91ceef7b9008",
] as const;
const DEMO_TECH_TEAM_A_ID = "019b17bd-d130-7e7d-be69-91ceef7b9005";
const DEMO_TECH_TEAM_B_ID = "019b17bd-d130-7e7d-be69-91ceef7b9006";
const DEMO_ENVIRONMENT_POLICY_ID = "019b17bd-d130-7e7d-be69-91ceef7b9010";

const DEMO_ENVIRONMENT_FORMULA_CONFIG = {
  return_scan_buffer_minutes: 3,
  confidence_factor: 0.85,
  display_unit: "gCO2e",
  formula_version: "PHASE_1_TIME_SPEED",
  distance_source: "TIME_SPEED",
} as const;

type DemoUser = {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  username: string;
  role: UserRole;
  verify: UserVerifyStatus;
};

type DemoRental = {
  id: string;
  userId: string;
  bikeId: string;
  startStationId: string;
  endStationId: string | null;
  createdAt: Date;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  totalPrice: number | null;
  subscriptionId: string | null;
  status: RentalStatus;
  updatedAt: Date;
};

type DemoReservation = {
  id: string;
  userId: string;
  bikeId: string;
  stationId: string;
  reservationOption: ReservationOption;
  subscriptionId: string | null;
  startTime: Date;
  endTime: Date;
  prepaid: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
};

type DemoOrgAssignment = {
  readonly user: DemoUser;
  readonly stationId: string | null;
  readonly agencyId: string | null;
  readonly technicianTeamId: string | null;
};

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

function toUtcDate(dayOffset: number, hour: number, minute: number) {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + dayOffset,
    hour,
    minute,
    0,
    0,
  ));
}

function toUtcDateInMonth(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
}

function pick<T>(arr: readonly T[], idx: number): T {
  return arr[idx % arr.length]!;
}

function getDemoTechnicianTeamId(index: number) {
  if (index === 0) {
    return DEMO_TECH_TEAM_A_ID;
  }

  if (index === 1) {
    return DEMO_TECH_TEAM_B_ID;
  }

  return `019b17bd-d130-7e7d-be69-${String(1000 + index).padStart(12, "0")}`;
}

async function seedStations(prisma: PrismaClient) {
  for (const station of stations) {
    const stationId = STATION_IDS[station.name] ?? uuidv7();
    const updatedAt = new Date(station.updatedAt);
    await prisma.$executeRaw`
      INSERT INTO "Station" (
        "id",
        "name",
        "address",
        "total_capacity",
        "return_slot_limit",
        "latitude",
        "longitude",
        "position",
        "updated_at"
      )
      VALUES (
        ${stationId}::uuid,
        ${station.name},
        ${station.address},
        ${station.capacity},
        ${station.capacity},
        ${station.latitude},
        ${station.longitude},
        ST_GeogFromText(${`SRID=4326;POINT(${station.longitude} ${station.latitude})`} ),
        ${updatedAt}
      )
      ON CONFLICT ("name") DO UPDATE
      SET
        "address" = EXCLUDED."address",
        "total_capacity" = EXCLUDED."total_capacity",
        "return_slot_limit" = EXCLUDED."return_slot_limit",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "position" = EXCLUDED."position",
        "updated_at" = EXCLUDED."updated_at"
    `;
  }
}

async function seedDemoEnvironmentPolicy(prisma: PrismaClient) {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.environmentalImpactPolicy.updateMany({
      where: {
        status: AccountStatus.ACTIVE,
        id: { not: DEMO_ENVIRONMENT_POLICY_ID },
      },
      data: {
        status: AccountStatus.INACTIVE,
        updatedAt: now,
      },
    });

    await tx.environmentalImpactPolicy.upsert({
      where: { id: DEMO_ENVIRONMENT_POLICY_ID },
      update: {
        name: "Default Phase 1 Demo Policy",
        averageSpeedKmh: toPrismaDecimal("12.00"),
        co2SavedPerKm: toPrismaDecimal("100.0000"),
        status: AccountStatus.ACTIVE,
        activeFrom: null,
        activeTo: null,
        formulaConfig: DEMO_ENVIRONMENT_FORMULA_CONFIG,
        updatedAt: now,
      },
      create: {
        id: DEMO_ENVIRONMENT_POLICY_ID,
        name: "Default Phase 1 Demo Policy",
        averageSpeedKmh: toPrismaDecimal("12.00"),
        co2SavedPerKm: toPrismaDecimal("100.0000"),
        status: AccountStatus.ACTIVE,
        activeFrom: null,
        activeTo: null,
        formulaConfig: DEMO_ENVIRONMENT_FORMULA_CONFIG,
        updatedAt: now,
      },
    });
  });
}

function buildDemoUsers(technicianCount: number): DemoUser[] {
  const users: DemoUser[] = [
    {
      id: uuidv7(),
      fullname: "Demo Admin",
      email: "admin@mebike.local",
      phoneNumber: "0900000001",
      username: "demo_admin",
      role: UserRole.ADMIN,
      verify: UserVerifyStatus.VERIFIED,
    },
    {
      id: uuidv7(),
      fullname: "Demo Staff 1",
      email: "staff1@mebike.local",
      phoneNumber: "0900000002",
      username: "demo_staff_1",
      role: UserRole.STAFF,
      verify: UserVerifyStatus.VERIFIED,
    },
    {
      id: uuidv7(),
      fullname: "Demo Staff 2",
      email: "staff2@mebike.local",
      phoneNumber: "0900000003",
      username: "demo_staff_2",
      role: UserRole.STAFF,
      verify: UserVerifyStatus.VERIFIED,
    },
    {
      id: uuidv7(),
      fullname: "Demo Manager",
      email: "manager@mebike.local",
      phoneNumber: "0900000004",
      username: "demo_manager",
      role: UserRole.MANAGER,
      verify: UserVerifyStatus.VERIFIED,
    },
    {
      id: uuidv7(),
      fullname: "Demo Agency Operator 1",
      email: "agency1@mebike.local",
      phoneNumber: "0900000005",
      username: "demo_agency_1",
      role: UserRole.AGENCY,
      verify: UserVerifyStatus.VERIFIED,
    },
    {
      id: uuidv7(),
      fullname: "Demo Agency Operator 2",
      email: "agency2@mebike.local",
      phoneNumber: "0900000006",
      username: "demo_agency_2",
      role: UserRole.AGENCY,
      verify: UserVerifyStatus.VERIFIED,
    },
  ];

  for (let i = 1; i <= technicianCount; i++) {
    users.push({
      id: uuidv7(),
      fullname: buildDemoTechnicianFullName(i),
      email: `tech${i}@mebike.local`,
      phoneNumber: `092${String(i).padStart(7, "0")}`,
      username: `demo_tech_${i}`,
      role: UserRole.TECHNICIAN,
      verify: UserVerifyStatus.VERIFIED,
    });
  }

  for (let i = 1; i <= USERS_TARGET - DEMO_NON_CUSTOMER_USERS; i++) {
    const order = String(i).padStart(2, "0");
    users.push({
      id: uuidv7(),
      fullname: buildDemoCustomerFullName(i),
      email: `user${order}@mebike.local`,
      phoneNumber: `091${String(i).padStart(7, "0")}`,
      username: `demo_user_${order}`,
      role: UserRole.USER,
      verify: UserVerifyStatus.VERIFIED,
    });
  }

  return users;
}

function buildRentals(params: {
  users: readonly DemoUser[];
  bikes: readonly { id: string; stationId: string | null }[];
  stationIds: readonly string[];
  subscriptionIdsByUserId: ReadonlyMap<string, string>;
}): DemoRental[] {
  const { users, bikes, stationIds, subscriptionIdsByUserId } = params;
  const normalUsers = users.filter(u => u.role === UserRole.USER);
  const rentals: DemoRental[] = [];

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(prevMonthYear, prevMonth + 1, 0)).getUTCDate();

  const pushCompleted = (count: number, dateFactory: (idx: number) => Date, startIdx = 0) => {
    for (let i = 0; i < count; i++) {
      const idx = startIdx + i;
      const user = pick(normalUsers, idx);
      const bike = pick(bikes, idx);
      const end = dateFactory(i);
      const duration = 20 + (idx % 12) * 10;
      const start = new Date(end.getTime() - duration * 60 * 1000);
      const startStation = bike.stationId ?? pick(stationIds, idx);
      const endStation = pick(stationIds, idx + 3);
      const subscriptionId = idx % 3 === 0 ? (subscriptionIdsByUserId.get(user.id) ?? null) : null;

      rentals.push({
        id: uuidv7(),
        userId: user.id,
        bikeId: bike.id,
        startStationId: startStation,
        endStationId: endStation,
        createdAt: new Date(start.getTime() - 5 * 60 * 1000),
        startTime: start,
        endTime: end,
        duration,
        totalPrice: 8000 + duration * 220,
        subscriptionId,
        status: RentalStatus.COMPLETED,
        updatedAt: end,
      });
    }
  };

  pushCompleted(12, idx => toUtcDate(0, 8 + (idx % 12), (idx * 7) % 60), 0);
  pushCompleted(9, idx => toUtcDate(-1, 9 + (idx % 9), (idx * 9) % 60), 100);
  pushCompleted(
    36,
    (idx) => {
      const day = ((idx % Math.max(1, daysInCurrentMonth - 2)) + 1);
      return toUtcDateInMonth(currentYear, currentMonth, day, 6 + (idx % 14), (idx * 11) % 60);
    },
    200,
  );
  pushCompleted(
    27,
    (idx) => {
      const day = ((idx % daysInPrevMonth) + 1);
      return toUtcDateInMonth(prevMonthYear, prevMonth, day, 7 + (idx % 12), (idx * 13) % 60);
    },
    300,
  );

  for (let i = 0; i < 18; i++) {
    const idx = 400 + i;
    const user = pick(normalUsers, idx);
    const bike = pick(bikes, idx);
    const start = toUtcDate(-2 - (i % 25), 10 + (i % 10), (i * 5) % 60);
    rentals.push({
      id: uuidv7(),
      userId: user.id,
      bikeId: bike.id,
      startStationId: bike.stationId ?? pick(stationIds, idx),
      endStationId: null,
      createdAt: new Date(start.getTime() - 10 * 60 * 1000),
      startTime: start,
      endTime: null,
      duration: null,
      totalPrice: null,
      subscriptionId: null,
      status: RentalStatus.CANCELLED,
      updatedAt: new Date(start.getTime() + 5 * 60 * 1000),
    });
  }

  const rentedUsers = normalUsers.slice(0, 8);
  const rentedBikes = bikes.slice(0, 8);
  for (let i = 0; i < 8; i++) {
    const start = toUtcDate(0, 6 + i, (i * 8) % 60);
    rentals.push({
      id: uuidv7(),
      userId: rentedUsers[i]!.id,
      bikeId: rentedBikes[i]!.id,
      startStationId: rentedBikes[i]!.stationId ?? pick(stationIds, i),
      endStationId: null,
      createdAt: new Date(start.getTime() - 8 * 60 * 1000),
      startTime: start,
      endTime: null,
      duration: Math.max(1, Math.floor((Date.now() - start.getTime()) / 60000)),
      totalPrice: null,
      subscriptionId: i % 2 === 0 ? (subscriptionIdsByUserId.get(rentedUsers[i]!.id) ?? null) : null,
      status: RentalStatus.RENTED,
      updatedAt: new Date(),
    });
  }

  return rentals.slice(0, RENTALS_TARGET);
}

function buildReservations(params: {
  users: readonly DemoUser[];
  bikes: readonly { id: string; stationId: string | null }[];
  subscriptionIdsByUserId: ReadonlyMap<string, string>;
}): DemoReservation[] {
  const { users, bikes, subscriptionIdsByUserId } = params;
  const normalUsers = users.filter(u => u.role === UserRole.USER).slice(8, 18);
  const reservationBikes = bikes.slice(8, 18);

  return reservationBikes.map((bike, idx) => {
    const user = normalUsers[idx]!;
    const startTime = toUtcDate(1 + (idx % 10), 7 + (idx % 8), (idx * 6) % 60);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    const subscriptionId = idx % 3 === 0 ? (subscriptionIdsByUserId.get(user.id) ?? null) : null;

    return {
      id: uuidv7(),
      userId: user.id,
      bikeId: bike.id,
      stationId: bike.stationId!,
      reservationOption: subscriptionId ? ReservationOption.SUBSCRIPTION : ReservationOption.ONE_TIME,
      subscriptionId,
      startTime,
      endTime,
      prepaid: subscriptionId ? 0 : 5000,
      status: ReservationStatus.PENDING,
      createdAt: new Date(startTime.getTime() - 30 * 60 * 1000),
      updatedAt: new Date(startTime.getTime() - 20 * 60 * 1000),
    };
  });
}

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    await upsertVietnamBoundary(prisma);
    await seedDefaultPricingPolicy(prisma);
    await seedDemoEnvironmentPolicy(prisma);
    await seedStations(prisma);
    await seedRatingReasons(prisma);

    const stationRows = await prisma.station.findMany({
      select: { id: true, name: true, latitude: true, longitude: true },
      orderBy: { name: "asc" },
    });
    const stationIds = stationRows.map(s => s.id);

    const suppliers = await Promise.all([
      prisma.supplier.upsert({
        where: { id: "019b17bd-d130-7e7d-be69-91ceef7b9001" },
        create: {
          id: "019b17bd-d130-7e7d-be69-91ceef7b9001",
          name: "Demo Supplier A",
          address: "District 2, Ho Chi Minh City",
          phoneNumber: "0988000001",
          contractFee: 0.12,
          status: SupplierStatus.ACTIVE,
          updatedAt: new Date(),
        },
        update: {
          name: "Demo Supplier A",
          address: "District 2, Ho Chi Minh City",
          phoneNumber: "0988000001",
          contractFee: 0.12,
          status: SupplierStatus.ACTIVE,
          updatedAt: new Date(),
        },
      }),
      prisma.supplier.upsert({
        where: { id: "019b17bd-d130-7e7d-be69-91ceef7b9002" },
        create: {
          id: "019b17bd-d130-7e7d-be69-91ceef7b9002",
          name: "Demo Supplier B",
          address: "District 9, Ho Chi Minh City",
          phoneNumber: "0988000002",
          contractFee: 0.15,
          status: SupplierStatus.ACTIVE,
          updatedAt: new Date(),
        },
        update: {
          name: "Demo Supplier B",
          address: "District 9, Ho Chi Minh City",
          phoneNumber: "0988000002",
          contractFee: 0.15,
          status: SupplierStatus.ACTIVE,
          updatedAt: new Date(),
        },
      }),
    ]);

    const users = buildDemoUsers(stationRows.length);
    const userEmails = users.map(u => u.email);

    await prisma.ratingReasonLink.deleteMany({
      where: {
        rating: {
          user: {
            email: {
              in: userEmails,
            },
          },
        },
      },
    });
    await prisma.rating.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.returnSlotReservation.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.bikeSwapRequest.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.returnConfirmation.deleteMany({
      where: {
        confirmedByUser: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.incidentReport.deleteMany({
      where: {
        reporterUser: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.rental.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.reservation.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.subscription.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.wallet.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.authEvent.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });
    await prisma.userOrgAssignment.deleteMany({
      where: {
        user: {
          email: {
            in: userEmails,
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: userEmails,
        },
      },
    });

    await prisma.bike.deleteMany({
      where: {
        bikeNumber: {
          startsWith: "DEMO-",
        },
      },
    });

    await prisma.user.createMany({
      data: users.map((u, idx) => ({
        id: u.id,
        fullName: u.fullname,
        email: u.email,
        phoneNumber: u.phoneNumber,
        username: u.username,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.fullname)}`,
        locationText: idx % 2 === 0 ? "Ho Chi Minh City" : "Thu Duc City",
        role: u.role,
        verifyStatus: u.verify,
        updatedAt: new Date(),
      })),
    });

    await prisma.userOrgAssignment.deleteMany({
      where: {
        agencyId: {
          in: [...LEGACY_DEMO_AGENCY_IDS],
        },
      },
    });

    await prisma.$executeRaw`
      UPDATE "Station"
      SET
        "station_type" = 'INTERNAL'::"station_type",
        "agency_id" = NULL
      WHERE "agency_id" IN (${LEGACY_DEMO_AGENCY_IDS[0]}::uuid, ${LEGACY_DEMO_AGENCY_IDS[1]}::uuid)
    `;

    await prisma.agency.deleteMany({
      where: {
        id: {
          in: [...LEGACY_DEMO_AGENCY_IDS],
        },
      },
    });

    const [mainAgency, eastAgency] = await Promise.all([
      prisma.agency.upsert({
        where: { id: DEMO_AGENCY_MAIN_ID },
        create: {
          id: DEMO_AGENCY_MAIN_ID,
          name: "Demo Agency Main",
          contactPhone: "02873000001",
          status: "ACTIVE",
        },
        update: {
          name: "Demo Agency Main",
          contactPhone: "02873000001",
          status: "ACTIVE",
        },
      }),
      prisma.agency.upsert({
        where: { id: DEMO_AGENCY_EAST_ID },
        create: {
          id: DEMO_AGENCY_EAST_ID,
          name: "Demo Agency East",
          contactPhone: "02873000002",
          status: "ACTIVE",
        },
        update: {
          name: "Demo Agency East",
          contactPhone: "02873000002",
          status: "ACTIVE",
        },
      }),
    ]);

    await prisma.$executeRaw`
      UPDATE "Station"
      SET
        "station_type" = 'INTERNAL'::"station_type",
        "agency_id" = NULL
    `;

    const agencyOwnedStations = [
      { stationId: stationIds[0], agencyId: mainAgency.id },
      { stationId: stationIds[1], agencyId: eastAgency.id },
    ].filter((item): item is { stationId: string; agencyId: string } => Boolean(item.stationId));

    for (const item of agencyOwnedStations) {
      await prisma.$executeRaw`
        UPDATE "Station"
        SET
          "station_type" = 'AGENCY'::"station_type",
          "agency_id" = ${item.agencyId}::uuid
        WHERE "id" = ${item.stationId}::uuid
      `;
    }

    const technicianTeams = await Promise.all(
      stationRows.map((station, index) => prisma.technicianTeam.upsert({
        where: { id: getDemoTechnicianTeamId(index) },
        create: {
          id: getDemoTechnicianTeamId(index),
          name: `Demo Tech Team - ${station.name}`,
          stationId: station.id,
        },
        update: {
          name: `Demo Tech Team - ${station.name}`,
          stationId: station.id,
        },
      })),
    );

    const userByEmail = new Map(users.map(user => [user.email, user]));
    const technicianAssignments: DemoOrgAssignment[] = technicianTeams
      .map((team, index) => ({
        user: userByEmail.get(`tech${index + 1}@mebike.local`),
        stationId: null,
        agencyId: null,
        technicianTeamId: team.id,
      }))
      .filter((item): item is DemoOrgAssignment => item.user !== undefined);
    const orgAssignments: DemoOrgAssignment[] = [
      {
        user: userByEmail.get("staff1@mebike.local"),
        stationId: pick(stationIds, 2),
        agencyId: null,
        technicianTeamId: null,
      },
      {
        user: userByEmail.get("staff2@mebike.local"),
        stationId: pick(stationIds, 3),
        agencyId: null,
        technicianTeamId: null,
      },
      {
        user: userByEmail.get("manager@mebike.local"),
        stationId: pick(stationIds, 0),
        agencyId: null,
        technicianTeamId: null,
      },
      {
        user: userByEmail.get("agency1@mebike.local"),
        stationId: null,
        agencyId: mainAgency.id,
        technicianTeamId: null,
      },
      {
        user: userByEmail.get("agency2@mebike.local"),
        stationId: null,
        agencyId: eastAgency.id,
        technicianTeamId: null,
      },
      ...technicianAssignments,
    ].filter((item): item is DemoOrgAssignment => item.user !== undefined);

    if (orgAssignments.length > 0) {
      await prisma.userOrgAssignment.createMany({
        data: orgAssignments.map(item => ({
          id: uuidv7(),
          userId: item.user.id,
          stationId: item.stationId ?? null,
          agencyId: item.agencyId ?? null,
          technicianTeamId: item.technicianTeamId ?? null,
        })),
      });
    }

    await prisma.wallet.createMany({
      data: users
        .map((u, idx) => ({
          id: uuidv7(),
          userId: u.id,
          balance: BigInt(250000 + idx * 15000),
          reservedBalance: BigInt(idx % 4 === 0 ? 10000 : 0),
          status: WalletStatus.ACTIVE,
          updatedAt: new Date(),
        })),
    });

    const bikesToCreate = Array.from({ length: 40 }, (_, idx) => ({
      id: uuidv7(),
      bikeNumber: `DEMO-${String(idx + 1).padStart(3, "0")}`,
      stationId: pick(stationIds, idx),
      supplierId: suppliers[idx % suppliers.length]!.id,
      status: BikeStatus.AVAILABLE,
      updatedAt: new Date(),
    }));

    await prisma.bike.createMany({ data: bikesToCreate });
    await setBikeNumberSequence(prisma, bikesToCreate.length);

    const subscriptionUsers = users.filter(u => u.role === UserRole.USER).slice(0, 12);
    const subscriptions = subscriptionUsers.map((user, idx) => ({
      id: uuidv7(),
      userId: user.id,
      packageName: idx % 3 === 0
        ? SubscriptionPackage.unlimited
        : idx % 3 === 1
          ? SubscriptionPackage.premium
          : SubscriptionPackage.basic,
      maxUsages: idx % 3 === 0 ? null : idx % 3 === 1 ? 60 : 30,
      usageCount: idx % 3 === 0 ? 0 : idx % 3 === 1 ? 8 : 5,
      status: SubscriptionStatus.ACTIVE,
      activatedAt: toUtcDate(-20 + idx, 9, 0),
      expiresAt: toUtcDate(45 + idx, 23, 0),
      price: BigInt(idx % 3 === 0 ? 499000 : idx % 3 === 1 ? 299000 : 149000),
      updatedAt: new Date(),
    }));
    await prisma.subscription.createMany({ data: subscriptions });

    const subscriptionIdsByUserId = new Map<string, string>(
      subscriptions.map(s => [s.userId, s.id]),
    );

    const rentals = buildRentals({
      users,
      bikes: bikesToCreate.map(b => ({ id: b.id, stationId: b.stationId })),
      stationIds,
      subscriptionIdsByUserId,
    });
    const reservations = buildReservations({
      users,
      bikes: bikesToCreate.map(b => ({ id: b.id, stationId: b.stationId })),
      subscriptionIdsByUserId,
    });

    await prisma.rental.createMany({
      data: rentals.map(r => ({
        id: r.id,
        userId: r.userId,
        bikeId: r.bikeId,
        startStationId: r.startStationId,
        endStationId: r.endStationId,
        createdAt: r.createdAt,
        startTime: r.startTime,
        endTime: r.endTime,
        duration: r.duration,
        totalPrice: r.totalPrice,
        subscriptionId: r.subscriptionId,
        status: r.status,
        updatedAt: r.updatedAt,
      })),
    });

    await prisma.reservation.createMany({
      data: reservations.map(r => ({
        id: r.id,
        userId: r.userId,
        bikeId: r.bikeId,
        stationId: r.stationId,
        reservationOption: r.reservationOption,
        subscriptionId: r.subscriptionId,
        startTime: r.startTime,
        endTime: r.endTime,
        prepaid: r.prepaid,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });

    const rentedBikeIds = rentals
      .filter(r => r.status === RentalStatus.RENTED)
      .map(r => r.bikeId)
      .filter((id): id is string => Boolean(id));

    if (rentedBikeIds.length > 0) {
      await prisma.bike.updateMany({
        where: {
          id: {
            in: rentedBikeIds,
          },
        },
        data: {
          status: BikeStatus.BOOKED,
          updatedAt: new Date(),
        },
      });
    }

    const reservedBikeIds = reservations.map(r => r.bikeId);
    if (reservedBikeIds.length > 0) {
      await prisma.bike.updateMany({
        where: {
          id: {
            in: reservedBikeIds,
          },
        },
        data: {
          status: BikeStatus.RESERVED,
          updatedAt: new Date(),
        },
      });
    }

    const agencyStatsRentals: DemoRental[] = [];
    const agencyStatsMainBike = bikesToCreate.find(b => b.stationId === agencyOwnedStations[0]?.stationId);
    const agencyStatsEastBike = bikesToCreate.find(b => b.stationId === agencyOwnedStations[1]?.stationId);
    const agencyStatsMainUser = userByEmail.get("user01@mebike.local");
    const agencyStatsEastUser = userByEmail.get("user02@mebike.local");
    const agencyStatsMainOperator = userByEmail.get("agency1@mebike.local");
    const agencyStatsEastOperator = userByEmail.get("agency2@mebike.local");

    if (
      agencyOwnedStations[0]?.stationId
      && agencyStatsMainBike
      && agencyStatsMainUser
      && agencyStatsMainOperator
    ) {
      const endTime = toUtcDate(-3, 11, 15);
      const startTime = new Date(endTime.getTime() - 52 * 60 * 1000);
      const rental = {
        id: uuidv7(),
        userId: agencyStatsMainUser.id,
        bikeId: agencyStatsMainBike.id,
        startStationId: agencyOwnedStations[0].stationId,
        endStationId: agencyOwnedStations[0].stationId,
        createdAt: new Date(startTime.getTime() - 5 * 60 * 1000),
        startTime,
        endTime,
        duration: 52,
        totalPrice: 36000,
        subscriptionId: null,
        status: RentalStatus.COMPLETED,
        updatedAt: endTime,
      } satisfies DemoRental;

      agencyStatsRentals.push(rental);

      await prisma.rental.create({
        data: {
          id: rental.id,
          userId: rental.userId,
          bikeId: rental.bikeId,
          startStationId: rental.startStationId,
          endStationId: rental.endStationId,
          createdAt: rental.createdAt,
          startTime: rental.startTime,
          endTime: rental.endTime,
          duration: rental.duration,
          totalPrice: rental.totalPrice,
          subscriptionId: rental.subscriptionId,
          status: rental.status,
          updatedAt: rental.updatedAt,
        },
      });

      await prisma.returnConfirmation.create({
        data: {
          id: uuidv7(),
          rentalId: rental.id,
          stationId: agencyOwnedStations[0].stationId,
          confirmedByUserId: agencyStatsMainOperator.id,
          confirmationMethod: ConfirmationMethod.MANUAL,
          handoverStatus: HandoverStatus.UNDER_AGENCY_CARE,
          confirmedAt: new Date(endTime.getTime() + 5 * 60 * 1000),
        },
      });

      await prisma.incidentReport.createMany({
        data: [
          {
            id: uuidv7(),
            reporterUserId: agencyStatsMainUser.id,
            rentalId: rental.id,
            bikeId: agencyStatsMainBike.id,
            stationId: agencyOwnedStations[0].stationId,
            source: IncidentSource.POST_RETURN,
            incidentType: "BRAKE",
            severity: IncidentSeverity.CRITICAL,
            description: "Demo critical agency incident",
            bikeLocked: true,
            status: IncidentStatus.OPEN,
            reportedAt: new Date(endTime.getTime() + 30 * 60 * 1000),
          },
        ],
      });
    }

    if (
      agencyOwnedStations[1]?.stationId
      && agencyStatsEastBike
      && agencyStatsEastUser
      && agencyStatsEastOperator
    ) {
      const endTime = toUtcDate(-5, 15, 10);
      const startTime = new Date(endTime.getTime() - 38 * 60 * 1000);
      const rental = {
        id: uuidv7(),
        userId: agencyStatsEastUser.id,
        bikeId: agencyStatsEastBike.id,
        startStationId: agencyOwnedStations[1].stationId,
        endStationId: agencyOwnedStations[1].stationId,
        createdAt: new Date(startTime.getTime() - 5 * 60 * 1000),
        startTime,
        endTime,
        duration: 38,
        totalPrice: 29000,
        subscriptionId: null,
        status: RentalStatus.COMPLETED,
        updatedAt: endTime,
      } satisfies DemoRental;

      agencyStatsRentals.push(rental);

      await prisma.rental.create({
        data: {
          id: rental.id,
          userId: rental.userId,
          bikeId: rental.bikeId,
          startStationId: rental.startStationId,
          endStationId: rental.endStationId,
          createdAt: rental.createdAt,
          startTime: rental.startTime,
          endTime: rental.endTime,
          duration: rental.duration,
          totalPrice: rental.totalPrice,
          subscriptionId: rental.subscriptionId,
          status: rental.status,
          updatedAt: rental.updatedAt,
        },
      });

      await prisma.returnConfirmation.create({
        data: {
          id: uuidv7(),
          rentalId: rental.id,
          stationId: agencyOwnedStations[1].stationId,
          confirmedByUserId: agencyStatsEastOperator.id,
          confirmationMethod: ConfirmationMethod.QR_CODE,
          handoverStatus: HandoverStatus.UNDER_AGENCY_CARE,
          confirmedAt: new Date(endTime.getTime() + 3 * 60 * 1000),
        },
      });

      await prisma.incidentReport.create({
        data: {
          id: uuidv7(),
          reporterUserId: agencyStatsEastUser.id,
          rentalId: rental.id,
          bikeId: agencyStatsEastBike.id,
          stationId: agencyOwnedStations[1].stationId,
          source: IncidentSource.DURING_RENTAL,
          incidentType: "CHAIN",
          severity: IncidentSeverity.MEDIUM,
          description: "Demo resolved agency incident",
          bikeLocked: false,
          status: IncidentStatus.RESOLVED,
          reportedAt: new Date(startTime.getTime() + 10 * 60 * 1000),
          resolvedAt: new Date(endTime.getTime() + 20 * 60 * 1000),
        },
      });
    }

    const tech1 = users.find(user => user.email === "tech1@mebike.local");
    const tech1Assignment = orgAssignments.find(item => item.user.email === "tech1@mebike.local");
    const user01 = users.find(user => user.email === "user01@mebike.local");
    const staff1 = users.find(user => user.email === "staff1@mebike.local");
    const staff1Assignment = orgAssignments.find(item => item.user.email === "staff1@mebike.local");
    const user01ActiveRental = rentals.find(rental => rental.status === RentalStatus.RENTED && rental.userId === user01?.id);
    const mainAgencyStationId = agencyOwnedStations[0]?.stationId ?? null;
    const user01IncidentStation = stationRows.find(station => station.id === user01ActiveRental?.startStationId);

    if (user01 && tech1 && tech1Assignment?.technicianTeamId && user01ActiveRental?.bikeId) {
      const reportedAt = new Date(Date.now() - 12 * 60 * 1000);
      const assignedAt = new Date(Date.now() - 9 * 60 * 1000);
      const existingActiveIncident = await prisma.incidentReport.findFirst({
        where: {
          bikeId: user01ActiveRental.bikeId,
          status: {
            in: [IncidentStatus.OPEN, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS],
          },
        },
        select: { id: true },
      });

      const technicianIncidentId = existingActiveIncident?.id ?? uuidv7();

      await prisma.incidentReport.upsert({
        where: { id: technicianIncidentId },
        create: {
          id: technicianIncidentId,
          reporterUserId: user01.id,
          rentalId: user01ActiveRental.id,
          bikeId: user01ActiveRental.bikeId,
          stationId: null,
          source: IncidentSource.DURING_RENTAL,
          incidentType: "FLAT_TIRE",
          severity: IncidentSeverity.HIGH,
          description: "Demo technician incident for user01 active rental",
          latitude: user01IncidentStation?.latitude,
          longitude: user01IncidentStation?.longitude,
          bikeLocked: true,
          status: IncidentStatus.OPEN,
          reportedAt,
        },
        update: {
          reporterUserId: user01.id,
          rentalId: user01ActiveRental.id,
          stationId: null,
          source: IncidentSource.DURING_RENTAL,
          incidentType: "FLAT_TIRE",
          severity: IncidentSeverity.HIGH,
          description: "Demo technician incident for user01 active rental",
          latitude: user01IncidentStation?.latitude,
          longitude: user01IncidentStation?.longitude,
          bikeLocked: true,
          status: IncidentStatus.OPEN,
          reportedAt,
          resolvedAt: null,
          closedAt: null,
        },
      });

      await prisma.technicianAssignment.deleteMany({
        where: { incidentReportId: technicianIncidentId },
      });

      await prisma.technicianAssignment.create({
        data: {
          id: uuidv7(),
          incidentReportId: technicianIncidentId,
          technicianTeamId: tech1Assignment.technicianTeamId,
          technicianUserId: tech1.id,
          assignedAt,
          status: AssignmentStatus.ASSIGNED,
          distanceMeters: 1800,
          durationSeconds: 420,
          routeGeometry: null,
        },
      });

      logger.info(
        {
          incidentFor: user01.email,
          assignedTechnician: tech1.email,
          rentalId: user01ActiveRental.id,
          incidentId: technicianIncidentId,
        },
        "Seeded demo technician incident assignment",
      );
    }

    if (user01 && staff1 && (mainAgencyStationId ?? staff1Assignment?.stationId) && user01ActiveRental?.bikeId) {
      const bikeSwapStationId = mainAgencyStationId ?? staff1Assignment!.stationId!;

      await prisma.bikeSwapRequest.create({
        data: {
          id: uuidv7(),
          rentalId: user01ActiveRental.id,
          userId: user01.id,
          oldBikeId: user01ActiveRental.bikeId,
          stationId: bikeSwapStationId,
          status: BikeSwapStatus.PENDING,
          reason: null,
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 60 * 1000),
        },
      });

      logger.info(
        {
          bikeSwapRequestFor: user01.email,
          handledBy: staff1.email,
          stationId: bikeSwapStationId,
        },
        "Seeded demo pending bike swap request",
      );
    }

    await seedDemoRatings(prisma, rentals);

    logger.info("Demo seed completed");
    logger.info({ users: users.length }, "Demo users seeded");
    logger.info({ rentals: rentals.length + agencyStatsRentals.length }, "Demo rentals seeded");
    logger.info(
      {
        completed:
          rentals.filter(r => r.status === RentalStatus.COMPLETED).length
          + agencyStatsRentals.filter(r => r.status === RentalStatus.COMPLETED).length,
      },
      "Completed rentals seeded",
    );
    logger.info(
      { cancelled: rentals.filter(r => r.status === RentalStatus.CANCELLED).length },
      "Cancelled rentals seeded",
    );
    logger.info(
      { pending: reservations.filter(r => r.status === ReservationStatus.PENDING).length },
      "Pending reservations seeded",
    );
    logger.info(
      { rented: rentals.filter(r => r.status === RentalStatus.RENTED).length },
      "Rented rentals seeded",
    );
    logger.info(
      {
        admin: "admin@mebike.local",
        staff: "staff1@mebike.local",
        manager: "manager@mebike.local",
        agency: "agency1@mebike.local",
        agency2: "agency2@mebike.local",
        technician: "tech1@mebike.local",
        user: "user01@mebike.local",
        password: DEMO_PASSWORD,
      },
      "Demo logins",
    );
  }
  finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Demo seed failed");
  process.exit(1);
});
