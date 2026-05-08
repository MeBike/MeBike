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
  NfcCardStatus,
  PrismaClient,
  RentalStatus,
  ReservationOption,
  ReservationStatus,
  SubscriptionPackage,
  SubscriptionStatus,
  SupplierStatus,
  UserRole,
  UserVerifyStatus,
  WalletHoldReason,
  WalletStatus,
} from "../generated/prisma/client";
import { formatBikeNumber } from "../src/domain/bikes/bike-number";
import { setBikeNumberSequence } from "../src/domain/bikes/repository/bike.repository.shared";
import { calculateUsageChargeMinor } from "../src/domain/pricing/calculator";
import { toPrismaDecimal } from "../src/domain/shared/decimal";
import { toMinorUnit } from "../src/domain/shared/money";
import logger from "../src/lib/logger";
import { seedDefaultGlobalCouponRules } from "./seed-coupon-rules";
import { upsertVietnamBoundary } from "./seed-geo-boundary";
import { DEFAULT_PRICING_POLICY_ID, seedDefaultPricingPolicy } from "./seed-pricing-policy";
import { seedDefaultSystemConfigs } from "./seed-system-configs";
import { buildDemoCustomerFullName, buildDemoTechnicianFullName } from "./seed/demo-faker";
import { seedDemoRatings } from "./seed/demo-ratings";
import { seedRatingReasons } from "./seed/rating-reasons";
import { STATION_IDS } from "./seed/station-ids";
import { stations } from "./seed/stations.data";

const DEMO_PASSWORD = "Demo@123456";

const DEMO_CUSTOMER_USERS = 25;
const USERS_TARGET = DEMO_CUSTOMER_USERS;
const RENTALS_TARGET = 120;
const STATION_ORDER_BY_NAME = new Map(stations.map((station, index) => [station.name, index + 1] as const));

function getStationOrder(name: string): number {
  return STATION_ORDER_BY_NAME.get(name) ?? 1;
}

function buildRoleEmail(prefix: "staff" | "manager" | "agency" | "tech", stationName: string): string {
  return `${prefix}${getStationOrder(stationName)}@mebike.local`;
}

function buildRoleUsername(prefix: "staff" | "manager" | "agency" | "tech", stationName: string): string {
  return `demo_${prefix}_${getStationOrder(stationName)}`;
}

const DEMO_DEFAULT_BIKES_PER_STATION = 15;
const DEMO_BIKES_PER_STATION_OVERRIDES: Record<string, number> = {
  "Ga Bến Thành": 40,
  "Ga Bình Thái": 5,
};
const DEMO_RENTAL_MIN_HOUR = 6;
const DEMO_RENTAL_MAX_HOUR = 22;
const DEMO_NFC_CARD_UID = "3946298114";
const DEMO_NFC_CARD_USER_EMAIL = "user02@mebike.local";

const DEMO_AGENCY_MAIN_ID = "019b17bd-d130-7e7d-be69-91ceef7b9003";
const DEMO_AGENCY_EAST_ID = "019b17bd-d130-7e7d-be69-91ceef7b9004";
const DEMO_AGENCY_MAIN_STATION_NAME = "Vincom Plaza";
const DEMO_AGENCY_STATION_NAMES = new Set([DEMO_AGENCY_MAIN_STATION_NAME]);
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

function toDemoRentalHour(hour: number) {
  return Math.max(DEMO_RENTAL_MIN_HOUR, Math.min(DEMO_RENTAL_MAX_HOUR, hour));
}

function toPastDemoRentalUtcDate(dayOffset: number, hour: number, minute: number) {
  const safeHour = toDemoRentalHour(hour);
  const candidate = toUtcDate(dayOffset, safeHour, minute);

  if (candidate.getTime() < Date.now()) {
    return candidate;
  }

  return toUtcDate(dayOffset - 1, safeHour, minute);
}

function toDemoRentalUtcDateInMonth(year: number, month: number, day: number, hour: number, minute: number) {
  return toUtcDateInMonth(year, month, day, toDemoRentalHour(hour), minute);
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
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
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
    ...stations.map((station, idx) => ({
      id: uuidv7(),
      fullname: `Demo Staff ${getStationOrder(station.name)} (${station.name})`,
      email: buildRoleEmail("staff", station.name),
      phoneNumber: `090${String(idx + 10).padStart(7, "0")}`,
      username: buildRoleUsername("staff", station.name),
      role: UserRole.STAFF,
      verify: UserVerifyStatus.VERIFIED,
    })),
    ...stations.map((station, idx) => ({
      id: uuidv7(),
      fullname: `Demo Manager ${getStationOrder(station.name)} (${station.name})`,
      email: buildRoleEmail("manager", station.name),
      phoneNumber: `090${String(idx + 30).padStart(7, "0")}`,
      username: buildRoleUsername("manager", station.name),
      role: UserRole.MANAGER,
      verify: UserVerifyStatus.VERIFIED,
    })),
    ...stations
      .filter(s => DEMO_AGENCY_STATION_NAMES.has(s.name))
      .map((station, idx) => ({
        id: uuidv7(),
        fullname: `Demo Agency ${getStationOrder(station.name)} (${station.name})`,
        email: buildRoleEmail("agency", station.name),
        phoneNumber: `090${String(idx + 50).padStart(7, "0")}`,
        username: buildRoleUsername("agency", station.name),
        role: UserRole.AGENCY,
        verify: UserVerifyStatus.VERIFIED,
      })),
  ];

  users.push(...stations.slice(0, technicianCount).map((station, index) => ({
    id: uuidv7(),
    fullname: `Demo Tech ${getStationOrder(station.name)} (${station.name})`,
    email: buildRoleEmail("tech", station.name),
    phoneNumber: `092${String(index + 1).padStart(7, "0")}`,
    username: buildRoleUsername("tech", station.name),
    role: UserRole.TECHNICIAN,
    verify: UserVerifyStatus.VERIFIED,
  })));

  for (let i = 1; i <= USERS_TARGET; i++) {
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

type PricingConfig = {
  baseRate: bigint;
  billingUnitMinutes: number;
  reservationFee: bigint;
  depositRequired: bigint;
};

function buildRentals(params: {
  users: readonly DemoUser[];
  bikes: readonly { id: string; stationId: string | null }[];
  stationIds: readonly string[];
  subscriptionIdsByUserId: ReadonlyMap<string, string>;
  pricing: PricingConfig;
}): DemoRental[] {
  const { users, bikes, stationIds, subscriptionIdsByUserId, pricing } = params;
  const normalUsers = users.filter(u => u.role === UserRole.USER);
  const rentals: DemoRental[] = [];

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = new Date(Date.UTC(prevMonthYear, prevMonth + 1, 0)).getUTCDate();
  const lastCompletedDayInCurrentMonth = now.getUTCDate() - 1;
  const completedCurrentMonthYear = lastCompletedDayInCurrentMonth >= 1 ? currentYear : prevMonthYear;
  const completedCurrentMonthMonth = lastCompletedDayInCurrentMonth >= 1 ? currentMonth : prevMonth;
  const completedCurrentMonthDays = lastCompletedDayInCurrentMonth >= 1
    ? lastCompletedDayInCurrentMonth
    : daysInPrevMonth;
  const activeRentalDayOffset = now.getUTCHours() >= 14 ? 0 : -1;

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

      const baseCharge = calculateUsageChargeMinor({ durationMinutes: duration, policy: pricing });
      const totalPrice = subscriptionId ? 0n : baseCharge;

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
        totalPrice: Number(totalPrice),
        subscriptionId,
        status: RentalStatus.COMPLETED,
        updatedAt: end,
      });
    }
  };

  pushCompleted(12, idx => toPastDemoRentalUtcDate(-1, 8 + (idx % 12), (idx * 7) % 60), 0);
  pushCompleted(9, idx => toPastDemoRentalUtcDate(-2, 9 + (idx % 9), (idx * 9) % 60), 100);
  pushCompleted(
    36,
    (idx) => {
      const day = (idx % completedCurrentMonthDays) + 1;
      return toDemoRentalUtcDateInMonth(
        completedCurrentMonthYear,
        completedCurrentMonthMonth,
        day,
        6 + (idx % 14),
        (idx * 11) % 60,
      );
    },
    200,
  );
  pushCompleted(
    27,
    (idx) => {
      const day = ((idx % daysInPrevMonth) + 1);
      return toDemoRentalUtcDateInMonth(prevMonthYear, prevMonth, day, 7 + (idx % 12), (idx * 13) % 60);
    },
    300,
  );

  const rentedUsers = normalUsers.slice(0, 8);
  const rentedBikes = Array.from({ length: 8 }, (_, i) => pick(bikes, i));
  for (let i = 0; i < 8; i++) {
    const start = toPastDemoRentalUtcDate(activeRentalDayOffset, 6 + i, (i * 8) % 60);
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
  pricing: PricingConfig;
}): DemoReservation[] {
  const { users, bikes, subscriptionIdsByUserId, pricing } = params;
  const normalUsers = users.filter(u => u.role === UserRole.USER).slice(8, 18);
  const reservationBikes = Array.from({ length: 10 }, (_, i) => pick(bikes, i + 8));

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
      prepaid: subscriptionId ? 0 : Number(pricing.reservationFee),
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
    await seedDefaultGlobalCouponRules(prisma, { demoMode: true });
    await seedDemoEnvironmentPolicy(prisma);
    await seedRatingReasons(prisma);
    await seedDefaultSystemConfigs(prisma);

    const pricingRow = await prisma.pricingPolicy.findUniqueOrThrow({
      where: { id: DEFAULT_PRICING_POLICY_ID },
    });
    const pricing: PricingConfig = {
      baseRate: toMinorUnit(pricingRow.baseRate),
      billingUnitMinutes: pricingRow.billingUnitMinutes,
      reservationFee: toMinorUnit(pricingRow.reservationFee),
      depositRequired: toMinorUnit(pricingRow.depositRequired),
    };

    const users = buildDemoUsers(stations.length);
    const userEmails = users.map(u => u.email);

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
    await prisma.environmentalImpactStat.deleteMany({
      where: {
        rental: {
          user: {
            email: {
              in: userEmails,
            },
          },
        },
      },
    });
    await prisma.rentalBillingRecord.deleteMany({
      where: {
        rental: {
          user: {
            email: {
              in: userEmails,
            },
          },
        },
      },
    });
    await prisma.walletHold.deleteMany({
      where: {
        wallet: {
          user: {
            email: {
              in: userEmails,
            },
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
    await prisma.nfcCard.deleteMany({
      where: {
        OR: [
          { uid: DEMO_NFC_CARD_UID },
          {
            assignedUser: {
              email: {
                in: userEmails,
              },
            },
          },
        ],
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

    await prisma.technicianTeam.deleteMany({
      where: {
        name: {
          startsWith: "Demo Tech Team -",
        },
      },
    });

    await seedStations(prisma);

    const stationRows = await prisma.station.findMany({
      select: { id: true, name: true, latitude: true, longitude: true },
      orderBy: { name: "asc" },
    });
    const stationIds = stationRows.map(s => s.id);

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

    const [mainAgency, _eastAgency] = await Promise.all([
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

    const stationIdByName = new Map(stationRows.map(station => [station.name, station.id]));
    const agencyOwnedStations = [
      { stationId: stationIdByName.get(DEMO_AGENCY_MAIN_STATION_NAME), agencyId: mainAgency.id },
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
    const demoNfcCardUser = userByEmail.get(DEMO_NFC_CARD_USER_EMAIL);
    if (demoNfcCardUser) {
      await prisma.nfcCard.create({
        data: {
          id: uuidv7(),
          uid: DEMO_NFC_CARD_UID,
          status: NfcCardStatus.ACTIVE,
          assignedUserId: demoNfcCardUser.id,
          issuedAt: new Date(),
        },
      });
    }

    const technicianAssignments = technicianTeams
      .map((team, index) => ({
        user: userByEmail.get(buildRoleEmail("tech", stationRows[index]!.name)),
        stationId: null,
        agencyId: null,
        technicianTeamId: team.id,
      }))
      .filter(item => item.user !== undefined) as DemoOrgAssignment[];
    const orgAssignments = [
      ...stationRows.map(station => ({
        user: userByEmail.get(buildRoleEmail("staff", station.name)),
        stationId: station.id,
        agencyId: null,
        technicianTeamId: null,
      })),
      ...stationRows.map(station => ({
        user: userByEmail.get(buildRoleEmail("manager", station.name)),
        stationId: station.id,
        agencyId: null,
        technicianTeamId: null,
      })),
      ...agencyOwnedStations.map((item) => {
        const station = stationRows.find(s => s.id === item.stationId);
        return {
          user: station ? userByEmail.get(buildRoleEmail("agency", station.name)) : undefined,
          stationId: null as string | null,
          agencyId: item.agencyId,
          technicianTeamId: null as string | null,
        };
      }),
      ...technicianAssignments,
    ].filter(item => item.user !== undefined) as DemoOrgAssignment[];

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

    let bikeCounter = 0;
    const bikesToCreate = stationRows.flatMap((station) => {
      const bikeCount = DEMO_BIKES_PER_STATION_OVERRIDES[station.name] ?? DEMO_DEFAULT_BIKES_PER_STATION;
      return Array.from({ length: bikeCount }, () => {
        bikeCounter++;
        return {
          id: uuidv7(),
          bikeNumber: formatBikeNumber(bikeCounter),
          stationId: station.id,
          supplierId: suppliers[bikeCounter % suppliers.length]!.id,
          status: BikeStatus.AVAILABLE,
          updatedAt: new Date(),
        };
      });
    });

    await prisma.bike.createMany({ data: bikesToCreate });
    await setBikeNumberSequence(prisma, bikesToCreate.length);

    const subscriptionUsers = users.filter(u => u.role === UserRole.USER).slice(0, 12);
    const subscriptions = subscriptionUsers.map((user, idx) => ({
      id: uuidv7(),
      userId: user.id,
      packageName: idx % 3 === 0
        ? SubscriptionPackage.ultra
        : idx % 3 === 1
          ? SubscriptionPackage.premium
          : SubscriptionPackage.basic,
      maxUsages: idx % 3 === 0 ? 90 : idx % 3 === 1 ? 60 : 30,
      usageCount: idx % 3 === 0 ? 12 : idx % 3 === 1 ? 8 : 5,
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

    const bikesIndex = bikesToCreate.map(b => ({ id: b.id, stationId: b.stationId }));

    const rentals = buildRentals({
      users,
      bikes: bikesIndex,
      stationIds,
      subscriptionIdsByUserId,
      pricing,
    });
    const reservations = buildReservations({
      users,
      bikes: bikesIndex,
      subscriptionIdsByUserId,
      pricing,
    });

    const INITIAL_DEPOSIT_BASE = 1500000n;
    const INITIAL_DEPOSIT_INCREMENT = 15000n;

    const userWalletDeductions = new Map<string, { debits: bigint; reserved: bigint }>();
    for (const rental of rentals) {
      const current = userWalletDeductions.get(rental.userId) ?? { debits: 0n, reserved: 0n };
      if (rental.status === RentalStatus.COMPLETED) {
        current.debits += BigInt(rental.totalPrice ?? 0);
      }
      if (rental.status === RentalStatus.RENTED) {
        current.reserved += pricing.depositRequired;
      }
      userWalletDeductions.set(rental.userId, current);
    }
    for (const res of reservations) {
      if (!res.subscriptionId && res.prepaid > 0) {
        const current = userWalletDeductions.get(res.userId) ?? { debits: 0n, reserved: 0n };
        current.debits += BigInt(res.prepaid);
        userWalletDeductions.set(res.userId, current);
      }
    }

    const walletData = users.map((u, idx) => {
      const deductions = userWalletDeductions.get(u.id) ?? { debits: 0n, reserved: 0n };
      const initialDeposit = INITIAL_DEPOSIT_BASE + BigInt(idx) * INITIAL_DEPOSIT_INCREMENT;
      return {
        id: uuidv7(),
        userId: u.id,
        initialDeposit,
        balance: initialDeposit - deductions.debits,
        reservedBalance: deductions.reserved,
        status: WalletStatus.ACTIVE,
        updatedAt: new Date(),
      };
    });
    await prisma.wallet.createMany({
      data: walletData.map(({ initialDeposit: _id, ...w }) => ({
        id: w.id,
        userId: w.userId,
        balance: w.balance,
        reservedBalance: w.reservedBalance,
        status: w.status,
        updatedAt: w.updatedAt,
      })),
    });

    const walletRows = await prisma.wallet.findMany({
      select: { id: true, userId: true },
    });
    const walletByUserId = new Map(walletRows.map(w => [w.userId, w.id]));

    const walletTransactions: {
      id: string;
      walletId: string;
      amount: bigint;
      fee: bigint;
      description: string | null;
      hash: string | null;
      type: string;
      status: string;
      createdAt: Date;
    }[] = [];

    for (const wd of walletData) {
      walletTransactions.push({
        id: uuidv7(),
        walletId: wd.id,
        amount: wd.initialDeposit,
        fee: 0n,
        description: "Demo initial deposit",
        hash: null,
        type: "DEPOSIT",
        status: "SUCCESS",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      });
    }

    const completedRentals = rentals.filter(r => r.status === RentalStatus.COMPLETED);
    for (const rental of completedRentals) {
      if (rental.totalPrice && rental.totalPrice > 0) {
        const walletId = walletByUserId.get(rental.userId);
        if (!walletId) {
          continue;
        }
        walletTransactions.push({
          id: uuidv7(),
          walletId,
          amount: BigInt(rental.totalPrice),
          fee: 0n,
          description: "Demo rental payment",
          hash: null,
          type: "DEBIT",
          status: "SUCCESS",
          createdAt: rental.endTime!,
        });
      }
    }

    for (const res of reservations) {
      if (!res.subscriptionId && res.prepaid > 0) {
        const walletId = walletByUserId.get(res.userId);
        if (!walletId) {
          continue;
        }
        walletTransactions.push({
          id: uuidv7(),
          walletId,
          amount: BigInt(res.prepaid),
          fee: 0n,
          description: "Demo reservation fee",
          hash: null,
          type: "DEBIT",
          status: "SUCCESS",
          createdAt: res.createdAt,
        });
      }
    }

    await prisma.walletTransaction.createMany({ data: walletTransactions });

    await prisma.rental.createMany({
      data: rentals.map(r => ({
        id: r.id,
        userId: r.userId,
        bikeId: r.bikeId,
        pricingPolicyId: DEFAULT_PRICING_POLICY_ID,
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

    const billingRecords = completedRentals.map((r) => {
      const baseCharge = calculateUsageChargeMinor({ durationMinutes: r.duration!, policy: pricing });
      const isSubscription = Boolean(r.subscriptionId);
      return {
        id: uuidv7(),
        rentalId: r.id,
        pricingPolicyId: DEFAULT_PRICING_POLICY_ID,
        totalDurationMinutes: r.duration!,
        baseAmount: toPrismaDecimal(isSubscription ? 0 : Number(baseCharge)),
        couponDiscountAmount: toPrismaDecimal(0),
        subscriptionDiscountAmount: toPrismaDecimal(isSubscription ? Number(baseCharge) : 0),
        depositForfeited: false,
        totalAmount: toPrismaDecimal(r.totalPrice ?? 0),
      };
    });
    if (billingRecords.length > 0) {
      await prisma.rentalBillingRecord.createMany({ data: billingRecords });
    }

    const rentedRentals = rentals.filter(r => r.status === RentalStatus.RENTED);
    if (rentedRentals.length > 0) {
      const holdCountByWalletId = new Map<string, number>();

      for (const rental of rentedRentals) {
        const walletId = walletByUserId.get(rental.userId);
        if (!walletId) {
          continue;
        }

        const holdId = uuidv7();
        await prisma.walletHold.create({
          data: {
            id: holdId,
            walletId,
            rentalId: rental.id,
            amount: pricing.depositRequired,
            reason: WalletHoldReason.RENTAL_DEPOSIT,
          },
        });
        await prisma.rental.update({
          where: { id: rental.id },
          data: { depositHoldId: holdId },
        });

        holdCountByWalletId.set(walletId, (holdCountByWalletId.get(walletId) ?? 0) + 1);
      }
    }

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

    const rentedBikeIds = rentedRentals
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
    const agencyStatsMainOperator = agencyOwnedStations[0]
      ? userByEmail.get(buildRoleEmail("agency", stationRows.find(s => s.id === agencyOwnedStations[0].stationId)!.name))
      : undefined;
    const agencyStatsEastOperator = agencyOwnedStations[1]
      ? userByEmail.get(buildRoleEmail("agency", stationRows.find(s => s.id === agencyOwnedStations[1].stationId)!.name))
      : undefined;

    if (
      agencyOwnedStations[0]?.stationId
      && agencyStatsMainBike
      && agencyStatsMainUser
      && agencyStatsMainOperator
    ) {
      const endTime = toUtcDate(-3, 11, 15);
      const startTime = new Date(endTime.getTime() - 52 * 60 * 1000);
      const duration = 52;
      const startStation = agencyOwnedStations[0].stationId;
      const endStation = agencyOwnedStations[0].stationId;
      const totalPrice = Number(calculateUsageChargeMinor({ durationMinutes: duration, policy: pricing }));
      const rental = {
        id: uuidv7(),
        userId: agencyStatsMainUser.id,
        bikeId: agencyStatsMainBike.id,
        startStationId: startStation,
        endStationId: endStation,
        createdAt: new Date(startTime.getTime() - 5 * 60 * 1000),
        startTime,
        endTime,
        duration,
        totalPrice,
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
          pricingPolicyId: DEFAULT_PRICING_POLICY_ID,
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
      const duration = 38;
      const startStation = agencyOwnedStations[1].stationId;
      const endStation = agencyOwnedStations[1].stationId;
      const totalPrice = Number(calculateUsageChargeMinor({ durationMinutes: duration, policy: pricing }));
      const rental = {
        id: uuidv7(),
        userId: agencyStatsEastUser.id,
        bikeId: agencyStatsEastBike.id,
        startStationId: startStation,
        endStationId: endStation,
        createdAt: new Date(startTime.getTime() - 5 * 60 * 1000),
        startTime,
        endTime,
        duration,
        totalPrice,
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
          pricingPolicyId: DEFAULT_PRICING_POLICY_ID,
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

    const user01 = users.find(user => user.email === "user01@mebike.local");
    const firstStation = stationRows[0];
    const tech1 = firstStation ? users.find(user => user.email === buildRoleEmail("tech", firstStation.name)) : undefined;
    const tech1Assignment = firstStation ? orgAssignments.find(item => item.user.email === buildRoleEmail("tech", firstStation.name)) : undefined;
    const staff1 = firstStation ? users.find(user => user.email === buildRoleEmail("staff", firstStation.name)) : undefined;
    const staff1Assignment = firstStation ? orgAssignments.find(item => item.user.email === buildRoleEmail("staff", firstStation.name)) : undefined;
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
        staff: firstStation ? buildRoleEmail("staff", firstStation.name) : undefined,
        manager: firstStation ? buildRoleEmail("manager", firstStation.name) : undefined,
        agency: agencyOwnedStations[0]
          ? buildRoleEmail("agency", stationRows.find(s => s.id === agencyOwnedStations[0].stationId)!.name)
          : undefined,
        technician: firstStation ? buildRoleEmail("tech", firstStation.name) : undefined,
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
