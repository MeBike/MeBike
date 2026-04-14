import type { RouteHandler } from "@hono/zod-openapi";
import type { EnvironmentContracts } from "@mebike/shared";

import { serverRoutes } from "@mebike/shared";
import { Effect } from "effect";

import { EnvironmentPolicyServiceTag } from "@/domain/environment";
import { toContractEnvironmentPolicy } from "@/http/presenters/environment.presenter";

type EnvironmentRoutes = typeof serverRoutes.environment;

const createPolicy: RouteHandler<
  EnvironmentRoutes["createEnvironmentPolicy"]
> = async (c) => {
  const body = c.req.valid("json");

  const eff = Effect.flatMap(EnvironmentPolicyServiceTag, service =>
    service.createPolicy({
      name: body.name,
      averageSpeedKmh: body.average_speed_kmh,
      co2SavedPerKm: body.co2_saved_per_km,
      returnScanBufferMinutes: body.return_scan_buffer_minutes,
      confidenceFactor: body.confidence_factor,
    }));

  const policy = await c.var.runPromise(eff);

  return c.json<EnvironmentContracts.EnvironmentPolicy, 201>(
    toContractEnvironmentPolicy(policy),
    201,
  );
};

export const EnvironmentPolicyController = {
  createPolicy,
} as const;
