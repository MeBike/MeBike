import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import { BikeStatus, PrismaClient } from "../generated/prisma/client";
import logger from "../src/lib/logger";
import bikes from "./seed/bike.json";

const stationMap: Record<string, string> = {
  "68e0b2ae63beb4054de09d10": "019b167a-3b6e-7f4b-bf73-211744979185", // Ga An Phú
  "68e0b2ae63beb4054de09d16": "019b167a-3b6b-768b-a37e-275860a058bf", // Ga Phước Long
  "68e0b2ae63beb4054de09d18": "019b167a-3b6d-7d11-907e-8cc5f92237e9", // Ga Thủ Đức
  "68e0b2ae63beb4054de09d1a": "019b167a-3b6e-7ae1-927d-bbb110d83f08", // Ga Bến xe Suối Tiên
  "68e0b2ae63beb4054de09d11": "019b167a-3b6f-7a43-90a0-58bbd459a125", // Ga Bến Thành
  "68e0b2ae63beb4054de09d12": "019b167a-3b73-71b1-af45-bae168e64bed", // Ga Ba Son
  "68e0b2ae63beb4054de09d13": "019b167a-3b74-7915-8b3e-274ccc3a226e", // Ga Bình Thái
  "68e0b2ae63beb4054de09d14": "019b167a-3b75-7b20-a4c3-5dd979d19528", // Ga Khu Công nghệ cao
  "68e0b2ae63beb4054de09d15": "019b167a-3b77-7399-b85c-ba5903840020", // Ga Tân Cảng
  "68e0b2ae63beb4054de09d19": "019b167a-3b78-7598-88b3-3842c1fa491f", // Ga Rạch Chiếc
  "68e0b2ae63beb4054de09d1b": "019b167a-3b79-77f1-b0d7-334394c5cd07", // Ga Đại học Quốc gia
  "68e0b2ae63beb4054de09d1c": "019b167a-3b7b-7fcc-9a8e-1331c44e37a6", // Ga Nhà hát Thành phố
  "68e0b2ae63beb4054de09d1d": "019b167a-3b7c-7933-9c4d-9637d540c092", // Ga Công viên Văn Thánh
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
    logger.info("Clearing existing bikes...");
    await prisma.bike.deleteMany();

    logger.info("Inserting bikes...");
    for (const bike of bikes as any[]) {
      const oldStationId = bike.station_id?.$oid || bike.station_id;
      const stationId = stationMap[oldStationId];

      if (!stationId) {
        logger.warn({ oldStationId }, "No station mapping found, skipping bike");
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
