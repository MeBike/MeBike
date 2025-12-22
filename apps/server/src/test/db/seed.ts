import type { Kysely } from "kysely";

import { sql } from "kysely";

import type { DB } from "../../../generated/prisma/types";

import { authEvents, rentals, stations, users } from "../fixtures/users-stats.seed";

export async function seed(db: Kysely<DB>) {
  if (users.length > 0) {
    await db.insertInto("User").values(users).execute();
  }

  if (stations.length > 0) {
    for (const station of stations) {
      await db.executeQuery(
        sql`
          INSERT INTO "Station"
            (id, name, address, capacity, latitude, longitude, updated_at, position)
          VALUES
            (
              ${station.id},
              ${station.name},
              ${station.address},
              ${station.capacity},
              ${station.latitude},
              ${station.longitude},
              ${station.updatedAt},
              ST_SetSRID(ST_MakePoint(${station.longitude}, ${station.latitude}), 4326)::geography
            )
        `.compile(db),
      );
    }
  }

  if (rentals.length > 0) {
    await db.insertInto("Rental").values(rentals).execute();
  }

  if (authEvents.length > 0) {
    await db.insertInto("AuthEvent").values(authEvents).execute();
  }
}
