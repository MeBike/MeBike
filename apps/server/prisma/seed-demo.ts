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
  SubscriptionPackage,
  SubscriptionStatus,
  SupplierStatus,
  UserRole,
  UserVerifyStatus,
  WalletStatus,
} from "../generated/prisma/client";
import logger from "../src/lib/logger";
import { upsertVietnamBoundary } from "./seed-geo-boundary";
import { STATION_IDS } from "./seed/station-ids";
import { stations } from "./seed/stations.data";

const DEMO_PASSWORD = "Demo@123456";

const USERS_TARGET = 32;
const RENTALS_TARGET = 120;

const ratingReasonsSeed: ReadonlyArray<{
  readonly type: RatingReasonType;
  readonly appliesTo: AppliesToEnum;
  readonly messages: string;
}> = [
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, messages: "Xe chạy êm, vận hành tốt" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, messages: "Xe sạch sẽ" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, messages: "Xe còn nhiều pin" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, messages: "Phanh chưa tốt" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, messages: "Xe bẩn hoặc có mùi" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, messages: "Pin yếu" },

  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.station, messages: "Trạm dễ tìm" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.station, messages: "Trạm gọn gàng, an toàn" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.station, messages: "Trạm khó tìm" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.station, messages: "Trạm đông, khó trả xe" },
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

async function seedStations(prisma: PrismaClient) {
  for (const station of stations) {
    const stationId = STATION_IDS[station.name] ?? uuidv7();
    const updatedAt = new Date(station.updatedAt);
    await prisma.$executeRaw`
      INSERT INTO "Station" (
        "id",
        "name",
        "address",
        "capacity",
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
        ${station.latitude},
        ${station.longitude},
        ST_GeogFromText(${`SRID=4326;POINT(${station.longitude} ${station.latitude})`} ),
        ${updatedAt}
      )
      ON CONFLICT ("name") DO UPDATE
      SET
        "address" = EXCLUDED."address",
        "capacity" = EXCLUDED."capacity",
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
      messages: true,
    },
  });

  const existingKeys = new Set(existing.map(item => `${item.type}|${item.appliesTo}|${item.messages}`));

  for (const reason of ratingReasonsSeed) {
    const key = `${reason.type}|${reason.appliesTo}|${reason.messages}`;
    if (existingKeys.has(key)) {
      continue;
    }

    await prisma.ratingReason.create({
      data: {
        id: uuidv7(),
        type: reason.type,
        appliesTo: reason.appliesTo,
        messages: reason.messages,
      },
    });
  }
}

function buildDemoUsers(): DemoUser[] {
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
      fullname: "Demo SOS",
      email: "sos@mebike.local",
      phoneNumber: "0900000004",
      username: "demo_sos",
      role: UserRole.SOS,
      verify: UserVerifyStatus.VERIFIED,
    },
  ];

  for (let i = 1; i <= USERS_TARGET - 4; i++) {
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

  for (let i = 0; i < 10; i++) {
    const idx = 500 + i;
    const user = pick(normalUsers, idx);
    const futureStart = toUtcDate(1 + (i % 10), 7 + (i % 9), (i * 6) % 60);
    rentals.push({
      id: uuidv7(),
      userId: user.id,
      bikeId: i % 2 === 0 ? pick(bikes, idx).id : null,
      startStationId: pick(stationIds, idx),
      endStationId: null,
      createdAt: new Date(futureStart.getTime() - 30 * 60 * 1000),
      startTime: futureStart,
      endTime: null,
      duration: null,
      totalPrice: null,
      subscriptionId: i % 3 === 0 ? (subscriptionIdsByUserId.get(user.id) ?? null) : null,
      status: RentalStatus.RESERVED,
      updatedAt: new Date(futureStart.getTime() - 20 * 60 * 1000),
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

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    await upsertVietnamBoundary(prisma);
    await seedStations(prisma);
    await seedRatingReasons(prisma);

    const stationRows = await prisma.station.findMany({
      select: { id: true },
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

    const users = buildDemoUsers();
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
    await prisma.rental.deleteMany({
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
        fullname: u.fullname,
        email: u.email,
        phoneNumber: u.phoneNumber,
        username: u.username,
        passwordHash,
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.fullname)}`,
        location: idx % 2 === 0 ? "Ho Chi Minh City" : "Thu Duc City",
        role: u.role,
        verify: u.verify,
        updatedAt: new Date(),
      })),
    });

    await prisma.wallet.createMany({
      data: users
        .filter(u => u.role !== UserRole.SOS)
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
        rating: 3 + (idx % 3),
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
      { reserved: rentals.filter(r => r.status === RentalStatus.RESERVED).length },
      "Reserved rentals seeded",
    );
    logger.info(
      { rented: rentals.filter(r => r.status === RentalStatus.RENTED).length },
      "Rented rentals seeded",
    );
    logger.info(
      {
        admin: "admin@mebike.local",
        staff: "staff1@mebike.local",
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
