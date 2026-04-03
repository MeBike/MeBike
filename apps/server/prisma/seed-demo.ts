import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import {
  AppliesToEnum,
  BikeStatus,
  PrismaClient,
  RatingReasonType,
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
import logger from "../src/lib/logger";
import { upsertVietnamBoundary } from "./seed-geo-boundary";
import { seedDefaultPricingPolicy } from "./seed-pricing-policy";
import { STATION_IDS } from "./seed/station-ids";
import { stations } from "./seed/stations.data";

const DEMO_PASSWORD = "Demo@123456";

const USERS_TARGET = 32;
const RENTALS_TARGET = 120;
const DEMO_NON_CUSTOMER_USERS = 6;

const DEMO_AGENCY_MAIN_ID = "019b17bd-d130-7e7d-be69-91ceef7b9003";
const DEMO_AGENCY_EAST_ID = "019b17bd-d130-7e7d-be69-91ceef7b9004";
const DEMO_AGENCY_NORTH_ID = "019b17bd-d130-7e7d-be69-91ceef7b9007";
const DEMO_AGENCY_SOUTH_ID = "019b17bd-d130-7e7d-be69-91ceef7b9008";
const DEMO_TECH_TEAM_A_ID = "019b17bd-d130-7e7d-be69-91ceef7b9005";
const DEMO_TECH_TEAM_B_ID = "019b17bd-d130-7e7d-be69-91ceef7b9006";

const ratingReasonsSeed: ReadonlyArray<{
  readonly type: RatingReasonType;
  readonly appliesTo: AppliesToEnum;
  readonly message: string;
}> = [
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, message: "Xe chạy êm, vận hành tốt" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, message: "Xe sạch sẽ" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, message: "Xe còn nhiều pin" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, message: "Phanh chưa tốt" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, message: "Xe bẩn hoặc có mùi" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, message: "Pin yếu" },

  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.station, message: "Trạm dễ tìm" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.station, message: "Trạm gọn gàng, an toàn" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.station, message: "Trạm khó tìm" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.station, message: "Trạm đông, khó trả xe" },
];

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
  bikeId: string | null;
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
        "pickup_slot_limit",
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
        "pickup_slot_limit" = EXCLUDED."pickup_slot_limit",
        "return_slot_limit" = EXCLUDED."return_slot_limit",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "position" = EXCLUDED."position",
        "updated_at" = EXCLUDED."updated_at"
    `;
  }
}

async function seedRatingReasons(prisma: PrismaClient) {
  const existing = await prisma.ratingReason.findMany({
    select: {
      id: true,
      type: true,
      appliesTo: true,
      message: true,
    },
  });

  const existingKeys = new Set(existing.map(item => `${item.type}|${item.appliesTo}|${item.message}`));

  for (const reason of ratingReasonsSeed) {
    const key = `${reason.type}|${reason.appliesTo}|${reason.message}`;
    if (existingKeys.has(key)) {
      continue;
    }

    await prisma.ratingReason.create({
      data: {
        id: uuidv7(),
        type: reason.type,
        appliesTo: reason.appliesTo,
        message: reason.message,
      },
    });
  }
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
      fullname: "Demo Agency Operator",
      email: "agency1@mebike.local",
      phoneNumber: "0900000005",
      username: "demo_agency_1",
      role: UserRole.AGENCY,
      verify: UserVerifyStatus.VERIFIED,
    },
  ];

  for (let i = 1; i <= technicianCount; i++) {
    users.push({
      id: uuidv7(),
      fullname: `Demo Technician ${i}`,
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
      fullname: `Demo User ${order}`,
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
    await seedStations(prisma);
    await seedRatingReasons(prisma);

    const stationRows = await prisma.station.findMany({
      select: { id: true, name: true },
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
        chipId: {
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

    const [mainAgency, eastAgency] = await Promise.all([
      prisma.agency.upsert({
        where: { id: DEMO_AGENCY_MAIN_ID },
        create: {
          id: DEMO_AGENCY_MAIN_ID,
          name: "Demo Agency Main",
          address: "District 1, Ho Chi Minh City",
          contactPhone: "02873000001",
          status: "ACTIVE",
        },
        update: {
          name: "Demo Agency Main",
          address: "District 1, Ho Chi Minh City",
          contactPhone: "02873000001",
          status: "ACTIVE",
        },
      }),
      prisma.agency.upsert({
        where: { id: DEMO_AGENCY_EAST_ID },
        create: {
          id: DEMO_AGENCY_EAST_ID,
          name: "Demo Agency East",
          address: "Thu Duc City, Ho Chi Minh City",
          contactPhone: "02873000002",
          status: "ACTIVE",
        },
        update: {
          name: "Demo Agency East",
          address: "Thu Duc City, Ho Chi Minh City",
          contactPhone: "02873000002",
          status: "ACTIVE",
        },
      }),
      prisma.agency.upsert({
        where: { id: DEMO_AGENCY_NORTH_ID },
        create: {
          id: DEMO_AGENCY_NORTH_ID,
          name: "Demo Agency North",
          address: "Go Vap, Ho Chi Minh City",
          contactPhone: "02873000003",
          status: "INACTIVE",
        },
        update: {
          name: "Demo Agency North",
          address: "Go Vap, Ho Chi Minh City",
          contactPhone: "02873000003",
          status: "INACTIVE",
        },
      }),
      prisma.agency.upsert({
        where: { id: DEMO_AGENCY_SOUTH_ID },
        create: {
          id: DEMO_AGENCY_SOUTH_ID,
          name: "Demo Agency South",
          address: "District 7, Ho Chi Minh City",
          contactPhone: "02873000004",
          status: "SUSPENDED",
        },
        update: {
          name: "Demo Agency South",
          address: "District 7, Ho Chi Minh City",
          contactPhone: "02873000004",
          status: "SUSPENDED",
        },
      }),
    ]);

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
    const technicianAssignments = technicianTeams
      .map((team, index) => ({
        user: userByEmail.get(`tech${index + 1}@mebike.local`),
        technicianTeamId: team.id,
      }))
      .filter(item => item.user !== undefined);
    const orgAssignments = [
      {
        user: userByEmail.get("staff1@mebike.local"),
        stationId: pick(stationIds, 2),
      },
      {
        user: userByEmail.get("staff2@mebike.local"),
        stationId: pick(stationIds, 3),
      },
      {
        user: userByEmail.get("manager@mebike.local"),
        stationId: pick(stationIds, 0),
      },
      {
        user: userByEmail.get("agency1@mebike.local"),
        agencyId: mainAgency.id,
      },
      {
        user: userByEmail.get("admin@mebike.local"),
        agencyId: eastAgency.id,
      },
      ...technicianAssignments,
    ].filter(item => item.user !== undefined);

    if (orgAssignments.length > 0) {
      await prisma.userOrgAssignment.createMany({
        data: orgAssignments.map(item => ({
          id: uuidv7(),
          userId: item.user!.id,
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
      chipId: `DEMO-CHIP-${String(idx + 1).padStart(3, "0")}`,
      stationId: pick(stationIds, idx),
      supplierId: suppliers[idx % suppliers.length]!.id,
      status: BikeStatus.AVAILABLE,
      updatedAt: new Date(),
    }));

    await prisma.bike.createMany({ data: bikesToCreate });

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

    const bikeReasons = await prisma.ratingReason.findMany({
      where: { appliesTo: AppliesToEnum.bike },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    const completedRentals = rentals.filter(r => r.status === RentalStatus.COMPLETED && r.bikeId);
    const ratedRentals = completedRentals.slice(0, 60);

    await prisma.rating.createMany({
      data: ratedRentals.map((r, idx) => ({
        id: uuidv7(),
        userId: r.userId,
        rentalId: r.id,
        bikeId: r.bikeId,
        stationId: r.endStationId ?? r.startStationId,
        bikeScore: 3 + (idx % 3),
        stationScore: 3 + ((idx + 1) % 3),
        comment: idx % 2 === 0 ? "Demo seeded rating" : null,
        updatedAt: new Date(),
      })),
    });

    const createdRatings = await prisma.rating.findMany({
      where: {
        rentalId: {
          in: ratedRentals.map(r => r.id),
        },
      },
      select: { id: true },
    });

    if (bikeReasons.length > 0 && createdRatings.length > 0) {
      await prisma.ratingReasonLink.createMany({
        data: createdRatings.map((rating, idx) => ({
          ratingId: rating.id,
          reasonId: pick(bikeReasons, idx).id,
          target: AppliesToEnum.bike,
        })),
        skipDuplicates: true,
      });
    }

    logger.info("Demo seed completed");
    logger.info({ users: users.length }, "Demo users seeded");
    logger.info({ rentals: rentals.length }, "Demo rentals seeded");
    logger.info(
      { completed: rentals.filter(r => r.status === RentalStatus.COMPLETED).length },
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
