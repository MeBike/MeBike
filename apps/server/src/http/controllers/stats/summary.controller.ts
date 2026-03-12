import type { RouteHandler } from "@hono/zod-openapi";

import { sql } from "kysely";

import { db } from "@/database";

type StatsRoutes = typeof import("@mebike/shared")["serverRoutes"]["stats"];

const getSummary: RouteHandler<StatsRoutes["getSummary"]> = async (c) => {
  const [stationRow, bikeRow, userRow] = await Promise.all([
    db.selectFrom("Station").select(sql<number>`count(*)`.as("count")).executeTakeFirst(),
    db.selectFrom("Bike").select(sql<number>`count(*)`.as("count")).executeTakeFirst(),
    db.selectFrom("User").select(sql<number>`count(*)`.as("count")).executeTakeFirst(),
  ]);

  return c.json({
    totalStations: Number(stationRow?.count ?? 0),
    totalBikes: Number(bikeRow?.count ?? 0),
    totalUsers: Number(userRow?.count ?? 0),
  }, 200);
};

export const StatsController = {
  getSummary,
} as const;
