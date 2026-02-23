import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { PrismaClient } from "../generated/prisma/client";

export async function upsertVietnamBoundary(prisma: PrismaClient) {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const filePath = join(currentDir, "seed", "vn.json");
  const geoJson = await readFile(filePath, "utf8");

  await prisma.$executeRaw`
    WITH features AS ( 
      SELECT jsonb_array_elements(${geoJson}::jsonb -> 'features') AS feature 
    ),
    geoms AS (
      SELECT ST_SetSRID(
        ST_GeomFromGeoJSON((feature -> 'geometry')::text),
        4326
      ) AS geom
      FROM features
    )
    INSERT INTO "GeoBoundary" ("code", "geom")
    SELECT
      'VN',
      ST_Multi(ST_Union(geom))::geometry(MultiPolygon, 4326)
    FROM geoms
    ON CONFLICT ("code") DO UPDATE
      SET "geom" = EXCLUDED."geom"
  `;
}
