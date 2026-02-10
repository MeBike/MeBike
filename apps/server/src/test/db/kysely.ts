import type { PoolConfig } from "pg";

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "generated/kysely/types";

export function makeTestDb(connectionString: string, poolConfig: PoolConfig = {}) {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
        max: 5,
        ...poolConfig,
      }),
    }),
  });
}

export async function destroyTestDb(db: Kysely<DB>) {
  await db.destroy();
}
