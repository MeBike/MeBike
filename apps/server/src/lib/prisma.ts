import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/config/env";
import { PrismaClient } from "generated/prisma/client";

export function makePrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}
