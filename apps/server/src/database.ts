import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { env } from "@/config/env";

import type { DB } from "../generated/prisma/types";

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
  }),
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<DB>({
  dialect,
});
