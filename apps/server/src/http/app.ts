import { OpenAPIHono } from "@hono/zod-openapi";
import { serverOpenApi } from "@mebike/shared";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

import { env } from "@/config/env";
import {
  currentUserMiddleware,
  requireAdminMiddleware,
  requireAdminOrStaffMiddleware,
  requireAuthMiddleware,
} from "@/http/middlewares/auth";
import logger from "@/lib/logger";

import { registerAuthRoutes } from "./routes/auth";
import { registerBikeRoutes } from "./routes/bikes";
import { registerRatingRoutes } from "./routes/ratings";
import { registerRentalRoutes } from "./routes/rentals";
import { registerStationRoutes } from "./routes/stations";
import { registerSubscriptionRoutes } from "./routes/subscriptions";
import { registerSupplierRoutes } from "./routes/suppliers";
import { registerUserRoutes } from "./routes/users";
import { registerWalletRoutes } from "./routes/wallets";

export function createHttpApp() {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (result.success) {
        return;
      }

      const issues = result.error.issues.map((issue) => {
        const path = Array.isArray(issue.path) && issue.path.length
          ? issue.path.join(".")
          : "body";
        return {
          path,
          message: issue.message,
          code: issue.code,
          expected: (issue as any).expected,
          received: (issue as any).received,
        };
      });

      return c.json(
        {
          error: "Invalid request payload",
          details: {
            code: "VALIDATION_ERROR",
            ...(issues.length ? { issues } : {}),
          },
        },
        400,
      );
    },
  });
  app.use("*", cors());
  app.use("*", honoLogger(message => logger.info(message)));
  app.use("*", currentUserMiddleware);
  app.use("/v1/rentals/*", requireAuthMiddleware);
  app.use("/v1/users/*", requireAuthMiddleware);
  app.use("/v1/ratings/*", requireAuthMiddleware);
  app.use("/v1/wallets/*", requireAuthMiddleware);
  app.use("/v1/subscriptions/*", requireAuthMiddleware);
  app.use("/v1/suppliers", requireAdminMiddleware);
  app.use("/v1/suppliers/*", requireAdminMiddleware);
  app.use("/v1/users/manage-users/*", requireAdminOrStaffMiddleware);
  app.use("/v1/users/manage-users/create", requireAdminMiddleware);
  app.use("/v1/users/manage-users/admin-reset-password/*", requireAdminMiddleware);

  app.doc("/docs/openapi.json", serverOpenApi);
  app.get(
    "/docs",
    Scalar({
      title: "Server API Reference",
      url: "/docs/openapi.json",
      layout: "modern",
    }),
  );

  registerStationRoutes(app);
  registerBikeRoutes(app);
  registerRentalRoutes(app);
  registerSupplierRoutes(app);
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerRatingRoutes(app);
  registerWalletRoutes(app);
  registerSubscriptionRoutes(app);

  app.onError((err, c) => {
    const isProd = env.NODE_ENV === "production";

    logger.error("Unhandled error", err);

    const body = isProd
      ? { error: "Internal Server Error" }
      : {
          error: "Internal Server Error",
          details: {
            message: err?.message ?? String(err),
            stack: err instanceof Error ? err.stack : undefined,
            cause: (err as { cause?: unknown })?.cause instanceof Error
              ? {
                  message: (err as { cause: Error }).cause.message,
                  stack: (err as { cause: Error }).cause.stack,
                }
              : (err as { cause?: unknown })?.cause,
          },
        };

    return c.json(body, 500);
  });

  return app;
}
