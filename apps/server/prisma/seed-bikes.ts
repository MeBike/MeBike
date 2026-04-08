import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import {
  BikeStatus,
  PrismaClient,
  RentalStatus,
  SupplierStatus,
  UserRole,
  UserVerifyStatus,
} from "../generated/prisma/client";
import { formatBikeNumber } from "../src/domain/bikes/bike-number";
import { setBikeNumberSequence } from "../src/domain/bikes/repository/bike.repository.shared";
import logger from "../src/lib/logger";
import bikes from "./seed/bike.json";
import { STATION_IDS } from "./seed/station-ids";

const stationNameMap: Record<string, string> = {
  "68e0b2ae63beb4054de09d10": "Ga An Phú",
  "68e0b2ae63beb4054de09d16": "Ga Phước Long",
  "68e0b2ae63beb4054de09d18": "Ga Thủ Đức",
  "68e0b2ae63beb4054de09d1a": "Ga Bến xe Suối Tiên",
  "68e0b2ae63beb4054de09d11": "Ga Bến Thành",
  "68e0b2ae63beb4054de09d12": "Ga Ba Son",
  "68e0b2ae63beb4054de09d13": "Ga Bình Thái",
  "68e0b2ae63beb4054de09d14": "Ga Khu Công nghệ cao",
  "68e0b2ae63beb4054de09d15": "Ga Tân Cảng",
  "68e0b2ae63beb4054de09d19": "Ga Rạch Chiếc",
  "68e0b2ae63beb4054de09d1b": "Ga Đại học Quốc gia",
  "68e0b2ae63beb4054de09d1c": "Ga Nhà hát Thành phố",
  "68e0b2ae63beb4054de09d1d": "Ga Công viên Văn Thánh",
};

const DEFAULT_SUPPLIER_NAME = "YADEA Ho Chi Minh";
const SEED_BIKES_USER_EMAIL = "seed-bikes@mebike.local";
const SEED_BIKES_USER_PHONE = "0900000999";
const SEED_BIKES_PASSWORD_HASH = "seed-bikes-not-for-login";

const bikeRatingPresets: ReadonlyArray<{
  readonly bikeScore: number;
  readonly stationScore: number;
  readonly comment: string;
}> = [
  { bikeScore: 5, stationScore: 5, comment: "Xe chay em va giu toc do tot." },
  { bikeScore: 4, stationScore: 5, comment: "Xe on dinh, tram lay xe de dang." },
  { bikeScore: 5, stationScore: 4, comment: "Xe sach se, pin con tot." },
  { bikeScore: 4, stationScore: 4, comment: "Trai nghiem tot cho chuyen di ngan." },
] as const;

const statusMap: Record<string, BikeStatus> = {
  "CÓ SẴN": BikeStatus.AVAILABLE,
  "ĐANG ĐƯỢC THUÊ": BikeStatus.BOOKED,
  "BỊ HỎNG": BikeStatus.BROKEN,
  "ĐÃ ĐẶT TRƯỚC": BikeStatus.RESERVED,
  "ĐANG BẢO TRÌ": BikeStatus.MAINTAINED,
  "KHÔNG CÓ SẴN": BikeStatus.UNAVAILABLE,
};

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

function pickBikeRatings(index: number) {
  return bikeRatingPresets[index % bikeRatingPresets.length];
}

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const seedUser = await prisma.user.upsert({
      where: { email: SEED_BIKES_USER_EMAIL },
      create: {
        id: uuidv7(),
        fullName: "Seed Bikes Demo User",
        email: SEED_BIKES_USER_EMAIL,
        phoneNumber: SEED_BIKES_USER_PHONE,
        passwordHash: SEED_BIKES_PASSWORD_HASH,
        role: UserRole.USER,
        verifyStatus: UserVerifyStatus.VERIFIED,
      },
      update: {
        fullName: "Seed Bikes Demo User",
        phoneNumber: SEED_BIKES_USER_PHONE,
        passwordHash: SEED_BIKES_PASSWORD_HASH,
        role: UserRole.USER,
        verifyStatus: UserVerifyStatus.VERIFIED,
        updatedAt: new Date(),
      },
    });

    await prisma.ratingReasonLink.deleteMany({
      where: {
        rating: {
          userId: seedUser.id,
        },
      },
    });
    await prisma.rating.deleteMany({
      where: {
        userId: seedUser.id,
      },
    });
    await prisma.rental.deleteMany({
      where: {
        userId: seedUser.id,
      },
    });

    let supplier = await prisma.supplier.findFirst({
      where: { name: DEFAULT_SUPPLIER_NAME },
    });
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          id: uuidv7(),
          name: DEFAULT_SUPPLIER_NAME,
          status: SupplierStatus.ACTIVE,
          updatedAt: new Date(),
        },
      });
    }
    if (!supplier) {
      throw new Error("Default supplier not found");
    }

    logger.info("Clearing existing bikes...");
    await prisma.bike.deleteMany();

    logger.info("Inserting bikes...");
    let maxBikeNumber = 0;
    for (const [bikeIndex, bike] of (bikes as any[]).entries()) {
      const oldStationId = bike.station_id?.$oid || bike.station_id;
      const stationName = oldStationId ? stationNameMap[oldStationId] : undefined;
      const stationId = stationName ? STATION_IDS[stationName] : undefined;

      if (!stationId) {
        logger.warn({ oldStationId, stationName }, "No station mapping found, skipping bike");
        continue;
      }

      const status = statusMap[bike.status] || BikeStatus.UNAVAILABLE;
      const updatedAt = new Date(bike.updated_at.$date || bike.updated_at);

      await prisma.bike.create({
        data: {
          id: uuidv7(),
          bikeNumber: formatBikeNumber(bikeIndex + 1),
          chipId: bike.chip_id,
          stationId,
          supplierId: supplier.id,
          status,
          updatedAt,
        },
      });

      maxBikeNumber = bikeIndex + 1;
    }

    if (maxBikeNumber > 0) {
      await setBikeNumberSequence(prisma, maxBikeNumber);
    }

    const seededAvailableBikes = await prisma.bike.findMany({
      where: {
        status: BikeStatus.AVAILABLE,
      },
      select: {
        id: true,
        stationId: true,
      },
      orderBy: [
        { stationId: "asc" },
        { chipId: "asc" },
      ],
    });

    const bikesByStation = new Map<string, Array<{ id: string; stationId: string }>>();
    for (const bike of seededAvailableBikes) {
      if (!bike.stationId) {
        continue;
      }

      const current = bikesByStation.get(bike.stationId) ?? [];
      if (current.length < 4) {
        current.push({ id: bike.id, stationId: bike.stationId });
        bikesByStation.set(bike.stationId, current);
      }
    }

    const bikesToRate = Array.from(bikesByStation.values()).flat();

    const now = Date.now();
    const rentalsToCreate = bikesToRate.flatMap((bike, bikeIndex) => {
      return Array.from({ length: 2 }, (_, ratingIndex) => {
        const hoursAgo = bikeIndex * 6 + ratingIndex * 18 + 24;
        const startTime = new Date(now - hoursAgo * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 22 * 60 * 1000);
        const preset = pickBikeRatings(bikeIndex + ratingIndex);

        return {
          rental: {
            id: uuidv7(),
            userId: seedUser.id,
            bikeId: bike.id,
            startStationId: bike.stationId,
            endStationId: bike.stationId,
            startTime,
            endTime,
            duration: 22,
            totalPrice: 12000,
            status: RentalStatus.COMPLETED,
            createdAt: new Date(startTime.getTime() - 5 * 60 * 1000),
            updatedAt: endTime,
          },
          rating: {
            id: uuidv7(),
            userId: seedUser.id,
            bikeId: bike.id,
            stationId: bike.stationId,
            bikeScore: preset.bikeScore,
            stationScore: preset.stationScore,
            comment: preset.comment,
            updatedAt: endTime,
          },
        };
      });
    });

    if (rentalsToCreate.length > 0) {
      await prisma.rental.createMany({
        data: rentalsToCreate.map(item => item.rental),
      });

      await prisma.rating.createMany({
        data: rentalsToCreate.map(item => ({
          ...item.rating,
          rentalId: item.rental.id,
        })),
      });
    }

    logger.info({ count: (bikes as any[]).length }, "Successfully inserted bikes");
    logger.info({ ratedBikes: bikesToRate.length, ratings: rentalsToCreate.length }, "Seeded demo bike ratings");
  }
  catch (error) {
    logger.error({ err: error }, "Error during seeding");
    throw error;
  }
  finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Seed failed");
  process.exit(1);
});
