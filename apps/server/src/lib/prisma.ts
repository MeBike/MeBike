import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/config/env";
import { PrismaClient } from "generated/prisma/client";

export function makePrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  return new PrismaClient({ adapter });
}
