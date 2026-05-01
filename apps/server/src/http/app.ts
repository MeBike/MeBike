import { OpenAPIHono } from "@hono/zod-openapi";
import { serverOpenApi } from "@mebike/shared";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

import type { RunPromise } from "@/http/shared/runtime";

import { env } from "@/config/env";
import { currentUserMiddleware } from "@/http/middlewares/auth";
import logger from "@/lib/logger";

import { registerAgencyRoutes } from "./routes/agencies";
import { registerAgencyRequestRoutes } from "./routes/agency-requests";
import { registerAiRoutes } from "./routes/ai";
import { registerAuthRoutes } from "./routes/auth";
import { registerBikeRoutes } from "./routes/bikes";
import { registerCouponRuleRoutes } from "./routes/coupon-rules";
import { registerEnvironmentRoutes } from "./routes/environment";
import { registerEventRoutes } from "./routes/events";
import { registerFixedSlotTemplateRoutes } from "./routes/fixed-slot-templates";
import { registerHealthRoutes } from "./routes/health";
import { registerIncidentRoutes } from "./routes/incidents";
import { registerOperatorRoutes } from "./routes/operators";
import { registerRatingRoutes } from "./routes/ratings";
import { registerRedistributionRoutes } from "./routes/redistribution";
import { registerRentalRoutes } from "./routes/rentals";
import { registerReservationRoutes } from "./routes/reservations";
import { registerStationRoutes } from "./routes/stations";
import { registerStatsRoutes } from "./routes/stats";
import { registerStripeConnectRoutes } from "./routes/stripe-connect.routes";
import { registerStripeWebhookRoutes } from "./routes/stripe-webhook.routes";
import { registerSubscriptionRoutes } from "./routes/subscriptions";
import { registerSupplierRoutes } from "./routes/suppliers";
import { registerTechnicianTeamRoutes } from "./routes/technician-teams";
import { registerUserRoutes } from "./routes/users";
import { registerWalletRoutes } from "./routes/wallets";

export function createHttpApp({ runPromise }: { runPromise: RunPromise }) {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (result.success) {
        return;
      }

      const issues = result.error.issues.map((issue) => {
        const path
          = Array.isArray(issue.path) && issue.path.length
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
  app.use(
    "*",
    honoLogger(message => logger.info(message)),
  );
  app.use("*", async (c, next) => {
    c.set("runPromise", runPromise);
    await next();
  });
  app.use("*", currentUserMiddleware);

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
  registerAiRoutes(app);
  registerStatsRoutes(app);
  registerHealthRoutes(app);
  registerFixedSlotTemplateRoutes(app);
  registerAgencyRoutes(app);
  registerAgencyRequestRoutes(app);
  registerBikeRoutes(app);
  registerCouponRuleRoutes(app);
  registerEnvironmentRoutes(app);
  registerEventRoutes(app);
  registerRentalRoutes(app);
  registerRedistributionRoutes(app);
  registerReservationRoutes(app);
  registerSupplierRoutes(app);
  registerTechnicianTeamRoutes(app);
  registerAuthRoutes(app);
  registerStripeConnectRoutes(app);
  registerStripeWebhookRoutes(app);
  registerUserRoutes(app);
  registerRatingRoutes(app);
  registerWalletRoutes(app);
  registerSubscriptionRoutes(app);
  registerIncidentRoutes(app);
  registerOperatorRoutes(app);

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
            cause:
              (err as { cause?: unknown })?.cause instanceof Error
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
