import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";

import { PrismaClient } from "../../generated/prisma/client";

export function makePrismaClient() {
  // TODO: centralize config
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
