import type { RouteHandler } from "@hono/zod-openapi";
import type { Kysely } from "kysely";

import type { DB } from "generated/kysely/types";

import { db } from "@/database";

type ConfigRoutes = typeof import("@mebike/shared")["serverRoutes"]["systemConfigs"];

const MAX_EXPIRE_MINUTES = 24 * 60; // 24 giờ

/**
 * Parses a duration string into total minutes.
 * Supported formats:
 *   - "H:M"   e.g. "24:00" → 1440 min, "0:45" → 45 min
 *   - float   e.g. "1.5"  → 90 min  (interpreted as hours)
 *   - integer e.g. "24"   → 1440 min (interpreted as hours)
 *
 * Returns `null` if the value is invalid, not positive, or exceeds 24 hours.
 */
export function parseExpirePeriod(value: string): number | null {
  const trimmed = value.trim();

  let totalMinutes: number;

  if (trimmed.includes(":")) {
    // H:M format
    const parts = trimmed.split(":");
    if (parts.length !== 2)
      return null;
    const hours = Number.parseInt(parts[0], 10);
    const minutes = Number.parseInt(parts[1], 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes))
      return null;
    if (hours < 0 || minutes < 0 || minutes >= 60)
      return null;
    totalMinutes = hours * 60 + minutes;
  }
  else {
    // float / integer hours
    const hours = Number.parseFloat(trimmed);
    if (Number.isNaN(hours) || hours <= 0)
      return null;
    totalMinutes = Math.round(hours * 60);
  }

  if (totalMinutes <= 0 || totalMinutes > MAX_EXPIRE_MINUTES)
    return null;
  return totalMinutes;
}

function formatConfig(cfg: any) {
  return {
    key: cfg.key,
    value: cfg.value,
    createdAt: cfg.created_at.toISOString(),
    updatedAt: cfg.updated_at.toISOString(),
  };
}

function sendValidationError(c: any, path: string, message: string) {
  return c.json({
    error: "Invalid value",
    details: {
      code: "VALIDATION_ERROR",
      issues: [{ path, message }],
    },
  } as any, 400);
}

export const getSystemConfigs: RouteHandler<ConfigRoutes["getSystemConfigs"]> = async (c) => {
  const configs = await db
    .selectFrom("system_configs")
    .selectAll()
    .orderBy("key", "asc")
    .execute();

  return c.json(configs.map(formatConfig), 200);
};

async function getSmallestCapacityStation(db: Kysely<DB>): Promise<{ total_capacity: number } | undefined> {
  return await db
    .selectFrom("Station")
    .select("total_capacity")
    .orderBy("total_capacity", "asc")
    .limit(1)
    .executeTakeFirst();
}

export const updateSystemConfig: RouteHandler<ConfigRoutes["updateSystemConfig"]> = async (c) => {
  const { key } = c.req.valid("param");
  const { value } = c.req.valid("json");

  const val = Number.parseInt(value, 10);

  if (key === "min_available_bikes_at_station" || key === "min_bikes_for_redistribution_alert") {
    if (Number.isNaN(val) || val < 0) {
      return sendValidationError(c, "value", `Value must be a non-negative integer for ${key}`);
    }

    const smallestCapacityStation = await getSmallestCapacityStation(db);
    if (smallestCapacityStation) {
      const maxAllowed = smallestCapacityStation.total_capacity / 2;
      if (val > maxAllowed) {
        return sendValidationError(
          c,
          "value",
          `Value must not be greater than half of the smallest station's capacity (${maxAllowed})`,
        );
      }
    }
  }
  else if (key === "redistribution_pending_expire_hours") {
    const parsedMinutes = parseExpirePeriod(value);
    if (parsedMinutes === null) {
      return sendValidationError(
        c,
        "value",
        `Invalid duration for ${key}. Use formats like "24", "1.5", "24:00", or "0:45". Duration must be positive and cannot exceed 24 hours.`,
      );
    }
  }

  const existing = await db
    .selectFrom("system_configs")
    .select("key")
    .where("key", "=", key)
    .executeTakeFirst();

  if (!existing) {
    return c.json({
      error: "Config not found",
      details: {
        code: "NOT_FOUND",
        issues: [{ path: "key", message: `SystemConfig with key '${key}' not found.` }],
      },
    } as any, 404);
  }

  const [updated] = await db
    .updateTable("system_configs")
    .set({
      value,
      updated_at: new Date(),
    })
    .where("key", "=", key)
    .returningAll()
    .execute();

  return c.json(formatConfig(updated), 200);
};
