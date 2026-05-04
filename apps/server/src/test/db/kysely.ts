import type { PoolConfig } from "pg";

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "generated/kysely/types";

function makePool(connectionString: string, poolConfig: PoolConfig = {}) {
  const pool = new Pool({
    connectionString,
    max: 5,
    ...poolConfig,
  });

  pool.on("error", (error: Error & { code?: string }) => {
    // Temporary test databases are force-dropped in teardown, so ignore the
    // expected admin-termination signal from idle pooled clients.
    if (error.code === "57P01") {
      return;
    }

    console.error("Unexpected test Postgres pool error", error);
  });

  return pool;
}

export function makeTestDb(connectionString: string, poolConfig: PoolConfig = {}) {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: makePool(connectionString, poolConfig),
    }),
  });
}

export async function destroyTestDb(db: Kysely<DB>) {
  await db.destroy();
}
