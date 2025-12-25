import { PgBoss } from "pg-boss";

import { env } from "@/config/env";

export function makePgBoss(): PgBoss {
  return new PgBoss({
    connectionString: env.DATABASE_URL,
  });
}
