import type { Kysely } from "kysely";

import { sql } from "kysely";

import type { DB } from "generated/kysely/types";

import { authEvents, bikes, rentals, stations, users } from "../fixtures/users-stats.seed";

function getBikeNumberSequenceValue(value: string): number {
  const numericPart = Number(value.split("-").at(-1));

  if (!Number.isFinite(numericPart) || numericPart < 0) {
    throw new Error(`Invalid bike number seed value: ${value}`);
  }

  return numericPart;
}

export async function seed(db: Kysely<DB>) {
  if (users.length > 0) {
    await db.insertInto("users").values(users).execute();
  }

  if (stations.length > 0) {
    for (const station of stations) {
      await db.executeQuery(
        sql`
          INSERT INTO "Station"
            (
              id,
              name,
              address,
              total_capacity,
              return_slot_limit,
              latitude,
              longitude,
              updated_at,
              position
            )
          VALUES
            (
              ${station.id},
              ${station.name},
              ${station.address},
              ${station.capacity},
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

  if (bikes.length > 0) {
    await db.insertInto("Bike").values(bikes).execute();

    const maxBikeNumber = Math.max(...bikes.map(bike => getBikeNumberSequenceValue(bike.bike_number)));

    await db.executeQuery(
      sql`SELECT setval('bike_number_seq', ${maxBikeNumber}, true)`.compile(db),
    );
  }

  if (rentals.length > 0) {
    await db.insertInto("Rental").values(rentals).execute();
  }

  if (authEvents.length > 0) {
    await db.insertInto("AuthEvent").values(authEvents).execute();
  }
}
