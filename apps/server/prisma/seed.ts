import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import { PrismaClient } from "../generated/prisma/client";
import { upsertVietnamBoundary } from "./seed-geo-boundary";
import { seedDefaultPricingPolicy } from "./seed-pricing-policy";
import { seedRatingReasons } from "./seed/rating-reasons";
import { seedSampleCompletedRatings } from "./seed/sample-completed-ratings";
import { STATION_IDS } from "./seed/station-ids";
import { stations } from "./seed/stations.data";

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  await upsertVietnamBoundary(prisma);
  await seedDefaultPricingPolicy(prisma);

  // Use the actual table name as it exists in the DB ("Station")
  await prisma.$executeRaw`TRUNCATE TABLE "Station" RESTART IDENTITY CASCADE`;

  for (const station of stations) {
    const updatedAt = new Date(station.updatedAt);
    const stationId = STATION_IDS[station.name] ?? uuidv7();
    await prisma.$executeRaw`
      INSERT INTO "Station" (
        "id",
        "name",
        "address",
        "total_capacity",
        "pickup_slot_limit",
        "return_slot_limit",
        "latitude",
        "longitude",
        "position",
        "updated_at"
      )
      VALUES (
        ${stationId}::uuid,
        ${station.name},
        ${station.address},
        ${station.capacity},
        ${station.capacity},
        ${station.capacity},
        ${station.latitude},
        ${station.longitude},
        ST_GeogFromText(${`SRID=4326;POINT(${station.longitude} ${station.latitude})`}),
        ${updatedAt}
      )
      ON CONFLICT ("name") DO NOTHING;
    `;
  }

  await seedRatingReasons(prisma);
  await seedSampleCompletedRatings(prisma);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
