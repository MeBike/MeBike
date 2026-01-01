import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import { BikeStatus, PrismaClient, SupplierStatus } from "../generated/prisma/client";
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

const DEFAULT_SUPPLIER_ID = "019b167a-3c00-0000-0000-000000000001";

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

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.supplier.upsert({
      where: { id: DEFAULT_SUPPLIER_ID },
      update: {},
      create: {
        id: DEFAULT_SUPPLIER_ID,
        name: "Default Supplier",
        status: SupplierStatus.ACTIVE,
        updatedAt: new Date(),
      },
    });

    logger.info("Clearing existing bikes...");
    await prisma.bike.deleteMany();

    logger.info("Inserting bikes...");
    for (const bike of bikes as any[]) {
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
          chipId: bike.chip_id,
          stationId,
          supplierId: DEFAULT_SUPPLIER_ID,
          status,
          updatedAt,
        },
      });
    }

    logger.info({ count: (bikes as any[]).length }, "Successfully inserted bikes");
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
