import type { RouteHandler } from "@hono/zod-openapi";
import type { EnvironmentContracts, ServerErrorResponse } from "@mebike/shared";

import {
  EnvironmentErrorCodeSchema,
  environmentErrorMessages,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { EnvironmentPolicyServiceTag } from "@/domain/environment";
import { toContractEnvironmentPolicy } from "@/http/presenters/environment.presenter";
import { toContractPage } from "@/http/shared/pagination";

type EnvironmentRoutes = typeof import("@mebike/shared")["serverRoutes"]["environment"];

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

const listPolicies: RouteHandler<
  EnvironmentRoutes["listEnvironmentPolicies"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = Effect.flatMap(EnvironmentPolicyServiceTag, service =>
    service.listPolicies({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }));

  const result = await c.var.runPromise(eff);

  return c.json<EnvironmentContracts.EnvironmentPolicyListResponse, 200>({
    data: result.items.map(toContractEnvironmentPolicy),
    pagination: toContractPage(result),
  }, 200);
};

const activatePolicy: RouteHandler<
  EnvironmentRoutes["activateEnvironmentPolicy"]
> = async (c) => {
  const { policyId } = c.req.valid("param");

  const eff = Effect.flatMap(EnvironmentPolicyServiceTag, service =>
    service.activatePolicy(policyId));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<EnvironmentContracts.EnvironmentPolicy, 200>(
        toContractEnvironmentPolicy(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("EnvironmentPolicyNotFound", () =>
          c.json<ServerErrorResponse, 404>({
            error: environmentErrorMessages.ENVIRONMENT_POLICY_NOT_FOUND,
            details: {
              code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_POLICY_NOT_FOUND,
            },
          }, 404)),
        Match.tag("EnvironmentPolicyActivationBlocked", () =>
          c.json<ServerErrorResponse, 409>({
            error: environmentErrorMessages.ENVIRONMENT_POLICY_ACTIVATION_BLOCKED,
            details: {
              code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_POLICY_ACTIVATION_BLOCKED,
            },
          }, 409)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const getActivePolicy: RouteHandler<
  EnvironmentRoutes["getActiveEnvironmentPolicy"]
> = async (c) => {
  const eff = Effect.flatMap(EnvironmentPolicyServiceTag, service =>
    service.getActivePolicy());

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<EnvironmentContracts.EnvironmentPolicy, 200>(
        toContractEnvironmentPolicy(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("ActiveEnvironmentPolicyNotFound", () =>
          c.json<ServerErrorResponse, 404>({
            error: environmentErrorMessages.ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND,
            details: {
              code: EnvironmentErrorCodeSchema.enum.ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND,
            },
          }, 404)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const EnvironmentPolicyController = {
  createPolicy,
  listPolicies,
  activatePolicy,
  getActivePolicy,
} as const;
