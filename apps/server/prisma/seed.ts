import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import {
  AppliesToEnum,
  BikeStatus,
  PrismaClient,
  RatingReasonType,
  RentalStatus,
  SupplierStatus,
  UserVerifyStatus,
} from "../generated/prisma/client";
import { upsertVietnamBoundary } from "./seed-geo-boundary";
import { seedDefaultPricingPolicy } from "./seed-pricing-policy";
import { STATION_IDS } from "./seed/station-ids";
import { stations } from "./seed/stations.data";

const DEFAULT_PRICING_POLICY_ID = "11111111-1111-4111-8111-111111111111";
const SEEDED_SUPPLIER_ID = "11111111-1111-4111-8111-111111111112";

const seededRatings = [
  {
    bikeChipId: "SEED-RATE-001",
    bikeScore: 5,
    comment: "Trai nghiem tot, xe van hanh on dinh.",
    duration: 32,
    email: "seeded-rating-user-1@mebike.local",
    fullName: "Seeded Rating User 01",
    phoneNumber: "0910000001",
    rentalId: "11111111-1111-4111-8111-111111111201",
    stationScore: 4,
  },
  {
    bikeChipId: "SEED-RATE-002",
    bikeScore: 3,
    comment: "Xe di duoc nhung phanh hoi yeu.",
    duration: 41,
    email: "seeded-rating-user-2@mebike.local",
    fullName: "Seeded Rating User 02",
    phoneNumber: "0910000002",
    rentalId: "11111111-1111-4111-8111-111111111202",
    stationScore: 5,
  },
  {
    bikeChipId: "SEED-RATE-003",
    bikeScore: 4,
    comment: "Tram de tim va tra xe nhanh.",
    duration: 27,
    email: "seeded-rating-user-3@mebike.local",
    fullName: "Seeded Rating User 03",
    phoneNumber: "0910000003",
    rentalId: "11111111-1111-4111-8111-111111111203",
    stationScore: 5,
  },
] as const;

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

async function seedRatingReasons(prisma: PrismaClient) {
  const existing = await prisma.ratingReason.findMany({
    select: {
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

async function seedSampleCompletedRatings(prisma: PrismaClient) {
  const stationRows = await prisma.station.findMany({
    orderBy: { name: "asc" },
    select: { id: true },
    take: seededRatings.length,
  });

  if (stationRows.length === 0) {
    return;
  }

  await prisma.supplier.upsert({
    where: { id: SEEDED_SUPPLIER_ID },
    update: {
      address: "Ho Chi Minh City",
      contractFee: 0.12,
      name: "Seeded Rating Supplier",
      phoneNumber: "0988000011",
      status: SupplierStatus.ACTIVE,
      updatedAt: new Date(),
    },
    create: {
      id: SEEDED_SUPPLIER_ID,
      address: "Ho Chi Minh City",
      contractFee: 0.12,
      name: "Seeded Rating Supplier",
      phoneNumber: "0988000011",
      status: SupplierStatus.ACTIVE,
      updatedAt: new Date(),
    },
  });

  const bikeReasons = await prisma.ratingReason.findMany({
    where: { appliesTo: AppliesToEnum.bike },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: 1,
  });
  const stationReasons = await prisma.ratingReason.findMany({
    where: { appliesTo: AppliesToEnum.station },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: 1,
  });

  for (const [index, seeded] of seededRatings.entries()) {
    const stationId = stationRows[index]?.id ?? stationRows[0]!.id;
    const userId = uuidv7();
    const bikeId = uuidv7();
    const rentalId = seeded.rentalId;
    const endTime = new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000);
    const startTime = new Date(endTime.getTime() - seeded.duration * 60 * 1000);

    const user = await prisma.user.upsert({
      where: { email: seeded.email },
      update: {
        fullName: seeded.fullName,
        passwordHash: "seeded-hash",
        phoneNumber: seeded.phoneNumber,
        verifyStatus: UserVerifyStatus.VERIFIED,
      },
      create: {
        id: userId,
        email: seeded.email,
        fullName: seeded.fullName,
        passwordHash: "seeded-hash",
        phoneNumber: seeded.phoneNumber,
        verifyStatus: UserVerifyStatus.VERIFIED,
      },
      select: { id: true },
    });

    const bike = await prisma.bike.upsert({
      where: { chipId: seeded.bikeChipId },
      update: {
        stationId,
        status: BikeStatus.AVAILABLE,
        supplierId: SEEDED_SUPPLIER_ID,
        updatedAt: new Date(),
      },
      create: {
        id: bikeId,
        chipId: seeded.bikeChipId,
        stationId,
        status: BikeStatus.AVAILABLE,
        supplierId: SEEDED_SUPPLIER_ID,
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.rental.upsert({
      where: { id: rentalId },
      update: {
        bikeId: bike.id,
        duration: seeded.duration,
        endStationId: stationId,
        endTime,
        pricingPolicyId: DEFAULT_PRICING_POLICY_ID,
        startStationId: stationId,
        startTime,
        status: RentalStatus.COMPLETED,
        totalPrice: seeded.duration * 1000,
        updatedAt: new Date(),
        userId: user.id,
      },
      create: {
        id: rentalId,
        bikeId: bike.id,
        duration: seeded.duration,
        endStationId: stationId,
        endTime,
        pricingPolicyId: DEFAULT_PRICING_POLICY_ID,
        startStationId: stationId,
        startTime,
        status: RentalStatus.COMPLETED,
        totalPrice: seeded.duration * 1000,
        updatedAt: new Date(),
        userId: user.id,
      },
    });

    const rating = await prisma.rating.upsert({
      where: { rentalId },
      update: {
        bikeId: bike.id,
        bikeScore: seeded.bikeScore,
        comment: seeded.comment,
        stationId,
        stationScore: seeded.stationScore,
        updatedAt: new Date(),
        userId: user.id,
      },
      create: {
        bikeId: bike.id,
        bikeScore: seeded.bikeScore,
        comment: seeded.comment,
        rentalId,
        stationId,
        stationScore: seeded.stationScore,
        userId: user.id,
      },
      select: { id: true },
    });

    await prisma.ratingReasonLink.deleteMany({
      where: { ratingId: rating.id },
    });

    const ratingReasonLinks = [
      ...(bikeReasons[0]
        ? [{
            ratingId: rating.id,
            reasonId: bikeReasons[0].id,
            target: AppliesToEnum.bike,
          }]
        : []),
      ...(stationReasons[0]
        ? [{
            ratingId: rating.id,
            reasonId: stationReasons[0].id,
            target: AppliesToEnum.station,
          }]
        : []),
    ];

    if (ratingReasonLinks.length > 0) {
      await prisma.ratingReasonLink.createMany({
        data: ratingReasonLinks,
        skipDuplicates: true,
      });
    }
  }
}

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  await upsertVietnamBoundary(prisma);
  await seedDefaultPricingPolicy(prisma);

  // Use the actual table name as it exists in the DB ("Station")
  await prisma.$executeRaw`TRUNCATE TABLE "Station" RESTART IDENTITY CASCADE`;

  for (const station of stations) {
    const updatedAt = new Date(station.updatedAt);
    const stationId = STATION_IDS[station.name] ?? uuidv7();
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
        ST_GeogFromText(${`SRID=4326;POINT(${station.longitude} ${station.latitude})`}),
        ${updatedAt}
      )
      ON CONFLICT ("name") DO NOTHING;
    `;
  }

  await seedRatingReasons(prisma);
  await seedSampleCompletedRatings(prisma);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
