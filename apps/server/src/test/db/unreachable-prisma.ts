import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "generated/prisma/client";

export type UnreachablePrisma = {
  readonly client: PrismaClient;
  readonly stop: () => Promise<void>;
};

export function makeUnreachablePrisma(
  url = "postgresql://invalid:invalid@localhost:54321/invalid",
  connectionTimeoutMillis = 100,
): UnreachablePrisma {
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis,
    max: 1,
  });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  return {
    client,
    stop: async () => {
      await client.$disconnect();
      await pool.end();
    },
  };
}
