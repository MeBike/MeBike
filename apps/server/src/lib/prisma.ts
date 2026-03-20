import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";

import { env } from "@/config/env";
import { PrismaClient } from "generated/prisma/client";

export function makePrismaClient() {
  const connectionString = env.NODE_ENV === "test"
    ? (process.env.TEST_DATABASE_URL ?? env.DATABASE_URL)
    : env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 5000 });
  return new PrismaClient({ adapter });
}
