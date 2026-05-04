import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "generated/kysely/types";

import { env } from "@/config/env";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
});

pool.on("error", (error: Error & { code?: string }) => {
  // Test teardown can terminate idle clients while dropping ephemeral databases.
  if (env.NODE_ENV === "test" && error.code === "57P01") {
    return;
  }

  console.error("Unexpected Postgres pool error", error);
});

const dialect = new PostgresDialect({
  pool,
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<DB>({
  dialect,
});
