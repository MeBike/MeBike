import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import {
  BikeStatus,
  PrismaClient,
  SupplierStatus,
} from "../generated/prisma/client";
import { formatBikeNumber } from "../src/domain/bikes/bike-number";
import { setBikeNumberSequence } from "../src/domain/bikes/repository/bike.repository.shared";
import logger from "../src/lib/logger";
import bikes from "./seed/bike.json";
import { STATION_IDS } from "./seed/station-ids";

type LegacyObjectId = { readonly $oid: string };
type LegacyDate = { readonly $date: string };

type LegacyBikeSeed = {
  readonly station_id?: LegacyObjectId | string | null;
  readonly status?: string | null;
  readonly created_at?: LegacyDate | string | null;
  readonly updated_at?: LegacyDate | string | null;
};

const LEGACY_STATION_NAME_BY_ID: Record<string, string> = {
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

const STATUS_BY_LEGACY_LABEL: Record<string, BikeStatus> = {
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

function readLegacyObjectId(value: LegacyObjectId | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.$oid;
}

function readLegacyDate(value: LegacyDate | string | null | undefined, fallback: Date) {
  if (!value) {
    return fallback;
  }

  const raw = typeof value === "string" ? value : value.$date;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

async function ensureStationsExist(prisma: PrismaClient) {
  const stationCount = await prisma.station.count();

  if (stationCount === 0) {
    throw new Error("No stations found. Run `pnpm seed` before `pnpm seed:bikes`.");
  }
}

async function ensureDefaultSupplier(prisma: PrismaClient) {
  const supplier = await prisma.supplier.findFirst({
    where: { name: DEFAULT_SUPPLIER_NAME },
    select: { id: true },
  });

  if (supplier) {
    return supplier;
  }

  return prisma.supplier.create({
    data: {
      id: uuidv7(),
      name: DEFAULT_SUPPLIER_NAME,
      status: SupplierStatus.ACTIVE,
      updatedAt: new Date(),
    },
    select: { id: true },
  });
}

function readManagedBikeNumberValue(bikeNumber: string) {
  if (!bikeNumber.startsWith("MB-")) {
    return undefined;
  }

  const value = Number.parseInt(bikeNumber.slice(3), 10);
  return Number.isNaN(value) ? undefined : value;
}

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await ensureStationsExist(prisma);

    const stationRows = await prisma.station.findMany({
      select: { id: true, name: true },
    });
    const seededStationIds = new Set(stationRows.map(station => station.id));
    const supplier = await ensureDefaultSupplier(prisma);
    const existingManagedBikes = await prisma.bike.findMany({
      where: {
        supplierId: supplier.id,
        bikeNumber: { startsWith: "MB-" },
      },
      select: { bikeNumber: true },
    });
    const maxExistingManagedBikeNumber = existingManagedBikes.reduce((max, bike) => {
      const numericValue = readManagedBikeNumberValue(bike.bikeNumber);
      return numericValue && numericValue > max ? numericValue : max;
    }, 0);

    logger.info("Upserting bikes from legacy import dataset...");

    let importedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedMissingStationCount = 0;
    let skippedMissingSeedStationCount = 0;
    let normalizedUnknownStatusCount = 0;

    for (const bike of bikes as LegacyBikeSeed[]) {
      const legacyStationId = readLegacyObjectId(bike.station_id);
      const stationName = legacyStationId ? LEGACY_STATION_NAME_BY_ID[legacyStationId] : undefined;
      const stationId = stationName ? STATION_IDS[stationName] : undefined;

      if (!stationId) {
        skippedMissingStationCount += 1;
        logger.warn({ legacyStationId, stationName }, "Skipping bike with unmapped legacy station");
        continue;
      }

      if (!seededStationIds.has(stationId)) {
        skippedMissingSeedStationCount += 1;
        logger.warn({ legacyStationId, stationId, stationName }, "Skipping bike because target station is missing in current seed data");
        continue;
      }

      const sourceStatus = bike.status?.trim() ?? "";
      const status = STATUS_BY_LEGACY_LABEL[sourceStatus] ?? BikeStatus.UNAVAILABLE;
      if (!(sourceStatus in STATUS_BY_LEGACY_LABEL)) {
        normalizedUnknownStatusCount += 1;
      }

      const createdAt = readLegacyDate(bike.created_at, new Date());
      const updatedAt = readLegacyDate(bike.updated_at, createdAt);
      importedCount += 1;
      const bikeNumber = formatBikeNumber(importedCount);

      const existing = await prisma.bike.findUnique({
        where: { bikeNumber },
        select: { id: true },
      });

      await prisma.bike.upsert({
        where: { bikeNumber },
        update: {
          stationId,
          supplierId: supplier.id,
          status,
          createdAt,
          updatedAt,
        },
        create: {
          id: uuidv7(),
          bikeNumber,
          stationId,
          supplierId: supplier.id,
          status,
          createdAt,
          updatedAt,
        },
      });

      if (existing) {
        updatedCount += 1;
      }
      else {
        createdCount += 1;
      }
    }

    const nextSequenceValue = Math.max(importedCount, maxExistingManagedBikeNumber);
    if (nextSequenceValue > 0) {
      await setBikeNumberSequence(prisma, nextSequenceValue);
    }

    logger.info(
      {
        importedCount,
        createdCount,
        updatedCount,
        nextSequenceValue,
        skippedMissingStationCount,
        skippedMissingSeedStationCount,
        normalizedUnknownStatusCount,
      },
      "Legacy bike import completed",
    );
  }
  catch (error) {
    logger.error({ err: error }, "Error during seeding bikes from legacy import");
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
