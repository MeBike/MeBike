import type { RouteHandler } from "@hono/zod-openapi";

import { db } from "@/database";

type ConfigRoutes = typeof import("@mebike/shared")["serverRoutes"]["systemConfigs"];

export const getSystemConfigs: RouteHandler<ConfigRoutes["getSystemConfigs"]> = async (c) => {
  const configs = await db
    .selectFrom("system_configs")
    .selectAll()
    .orderBy("key", "asc")
    .execute();

  const formattedConfigs = configs.map(cfg => ({
    key: cfg.key,
    value: cfg.value,
    createdAt: cfg.created_at.toISOString(),
    updatedAt: cfg.updated_at.toISOString(),
  }));

  return c.json(formattedConfigs, 200);
};

export const updateSystemConfig: RouteHandler<ConfigRoutes["updateSystemConfig"]> = async (c) => {
  const { key } = c.req.valid("param");
  const body = c.req.valid("json");
  const { value } = body;

  // Validation bounds
  if (key === "min_available_bikes_at_station") {
    const val = Number.parseInt(value, 10);
    if (Number.isNaN(val) || val < 0) {
      return c.json({
        error: "Invalid value",
        details: {
          code: "VALIDATION_ERROR",
          issues: [{ path: "value", message: "Value must be a non-negative integer for min_available_bikes_at_station" }],
        },
      } as any, 400);
    }
  }
  else if (key === "redistribution_pending_expire_hours") {
    const val = Number.parseInt(value, 10);
    if (Number.isNaN(val) || val < 1) {
      return c.json({
        error: "Invalid value",
        details: {
          code: "VALIDATION_ERROR",
          issues: [{ path: "value", message: "Value must be a positive integer for redistribution_pending_expire_hours" }],
        },
      } as any, 400);
    }
  }

  // Check if config exists
  const existing = await db
    .selectFrom("system_configs")
    .selectAll()
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

  const now = new Date();
  const [updated] = await db
    .updateTable("system_configs")
    .set({
      value,
      updated_at: now,
    })
    .where("key", "=", key)
    .returningAll()
    .execute();

  return c.json({
    key: updated.key,
    value: updated.value,
    createdAt: updated.created_at.toISOString(),
    updatedAt: updated.updated_at.toISOString(),
  }, 200);
};
