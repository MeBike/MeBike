CREATE TABLE IF NOT EXISTS "GeoBoundary" (
  "code" TEXT NOT NULL,
  "geom" geometry(MultiPolygon, 4326) NOT NULL,
  CONSTRAINT "GeoBoundary_pkey" PRIMARY KEY ("code")
);

CREATE INDEX IF NOT EXISTS "GeoBoundary_geom_gix"
  ON "GeoBoundary" USING GIST ("geom");
