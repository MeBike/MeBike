import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";

import { PrismaClient, SupplierStatus } from "../generated/prisma/client";
import logger from "../src/lib/logger";

const suppliers = [
  {
    oldId: "68e260a5d04813da448c56f1",
    newId: "019b167a-3c00-0000-0000-000000000001",
    name: "YADEA Ho Chi Minh",
    address: "Quận 2, TP.HCM",
    phoneNumber: "0362583697",
    contractFee: 0.15,
    status: "HOẠT ĐỘNG",
    createdAt: "2025-10-18T19:57:05.496Z",
    updatedAt: "2025-11-10T13:08:23.233Z",
  },
  {
    oldId: "691183a5f3d1e2af52f54ae8",
    newId: "019b167a-3c00-0000-0000-000000000002",
    name: "HONDA Ho Chi Minh",
    address: "Quận 2, TP.HCM",
    phoneNumber: "0888219421",
    contractFee: 0.15,
    status: "HOẠT ĐỘNG",
    createdAt: "2025-11-10T13:18:13.475Z",
    updatedAt: "2025-11-10T13:21:11.530Z",
  },
  {
    oldId: "60d5f1b3e7b3c9a4b4f4b3a2",
    newId: "019b167a-3c00-0000-0000-000000000003",
    name: "Công ty TNHH YADEA Việt Nam",
    address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
    phoneNumber: "0987654321",
    contractFee: 250000.50,
    status: "HOẠT ĐỘNG",
    createdAt: "2025-10-05T19:12:21.230Z",
    updatedAt: "2025-11-20T12:44:38.818Z",
  },
];

const statusMap: Record<string, SupplierStatus> = {
  "HOẠT ĐỘNG": SupplierStatus.ACTIVE,
  "KHÔNG HOẠT ĐỘNG": SupplierStatus.INACTIVE,
  "ĐÃ CHẤM DỨT": SupplierStatus.TERMINATED,
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
    logger.info("Clearing existing suppliers...");
    await prisma.supplier.deleteMany();

    logger.info("Inserting suppliers...");
    for (const supplier of suppliers) {
      const status = statusMap[supplier.status] || SupplierStatus.ACTIVE;
      const updatedAt = new Date(supplier.updatedAt);

      await prisma.supplier.create({
        data: {
          id: supplier.newId,
          name: supplier.name,
          address: supplier.address,
          phoneNumber: supplier.phoneNumber,
          contractFee: supplier.contractFee,
          status,
          updatedAt,
        },
      });

      logger.info(`Created supplier: ${supplier.name} (${supplier.newId})`);
    }

    logger.info(`Successfully inserted ${suppliers.length} suppliers`);
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
