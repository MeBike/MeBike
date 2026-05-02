import type { RouteHandler } from "@hono/zod-openapi";
import type { PricingPoliciesContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import {
  PricingPolicyCommandServiceTag,
  PricingPolicyQueryServiceTag,
} from "@/domain/pricing";
import { withLoggedCause } from "@/domain/shared";
import { toMinorUnit } from "@/domain/shared/money";
import {
  toContractPricingPolicy,
  toContractPricingPolicyDetail,
} from "@/http/presenters/pricing-policies.presenter";

import type { PricingPoliciesRoutes } from "./shared";

import {
  PricingPolicyErrorCodeSchema,
  pricingPolicyErrorMessages,
} from "./shared";

function parseLateReturnCutoff(value: string): Date {
  const normalized = value.length === 5 ? `${value}:00` : value;
  return new Date(`1970-01-01T${normalized}.000Z`);
}

function toContractIssuePath(path: string): string {
  switch (path) {
    case "baseRate":
      return "base_rate";
    case "billingUnitMinutes":
      return "billing_unit_minutes";
    case "reservationFee":
      return "reservation_fee";
    case "depositRequired":
      return "deposit_required";
    default:
      return path;
  }
}

const adminCreatePricingPolicy: RouteHandler<
  PricingPoliciesRoutes["adminCreate"]
> = async (c) => {
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.flatMap(PricingPolicyCommandServiceTag, service =>
      service.createPolicy({
        name: body.name,
        baseRate: toMinorUnit(body.base_rate),
        billingUnitMinutes: body.billing_unit_minutes,
        reservationFee: toMinorUnit(body.reservation_fee),
        depositRequired: toMinorUnit(body.deposit_required),
        lateReturnCutoff: parseLateReturnCutoff(body.late_return_cutoff),
      })),
    "POST /v1/admin/pricing-policies",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<PricingPoliciesContracts.PricingPolicy, 201>(
        toContractPricingPolicy(right),
        201,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("PricingPolicyInvalidInput", ({ issues }) =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 400>({
            error: pricingPolicyErrorMessages.PRICING_POLICY_INVALID_INPUT,
            details: {
              code: "PRICING_POLICY_INVALID_INPUT",
              issues: issues.map(issue => ({
                path: toContractIssuePath(issue.path),
                message: issue.message,
              })),
            },
          }, 400)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const adminListPricingPolicies: RouteHandler<
  PricingPoliciesRoutes["adminList"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(PricingPolicyQueryServiceTag, service =>
      service.listPolicies(query.status, {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
      })),
    "GET /v1/admin/pricing-policies",
  );

  const result = await c.var.runPromise(eff);

  return c.json<PricingPoliciesContracts.PricingPolicyListResponse, 200>({
    data: result.items.map(toContractPricingPolicy),
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  }, 200);
};

const adminGetPricingPolicy: RouteHandler<
  PricingPoliciesRoutes["adminGet"]
> = async (c) => {
  const { pricingPolicyId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(PricingPolicyQueryServiceTag, service =>
      Effect.gen(function* () {
        const policy = yield* service.getById(pricingPolicyId);
        const usageSummary = yield* service.getUsageSummary(pricingPolicyId);

        return { policy, usageSummary };
      })),
    "GET /v1/admin/pricing-policies/{pricingPolicyId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<PricingPoliciesContracts.PricingPolicyDetail, 200>(
        toContractPricingPolicyDetail(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("PricingPolicyNotFound", () =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 404>({
            error: pricingPolicyErrorMessages.PRICING_POLICY_NOT_FOUND,
            details: {
              code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_NOT_FOUND,
              pricingPolicyId,
            },
          }, 404)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const adminUpdatePricingPolicy: RouteHandler<
  PricingPoliciesRoutes["adminUpdate"]
> = async (c) => {
  const { pricingPolicyId } = c.req.valid("param");
  const body = c.req.valid("json");
  const updateInput = {
    pricingPolicyId,
    name: body.name,
    baseRate: body.base_rate === undefined ? undefined : toMinorUnit(body.base_rate),
    billingUnitMinutes: body.billing_unit_minutes,
    reservationFee: body.reservation_fee === undefined ? undefined : toMinorUnit(body.reservation_fee),
    depositRequired: body.deposit_required === undefined ? undefined : toMinorUnit(body.deposit_required),
    lateReturnCutoff: body.late_return_cutoff === undefined
      ? undefined
      : parseLateReturnCutoff(body.late_return_cutoff),
  };

  const eff = withLoggedCause(
    Effect.flatMap(PricingPolicyCommandServiceTag, service =>
      service.updatePolicy(updateInput)),
    "PATCH /v1/admin/pricing-policies/{pricingPolicyId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<PricingPoliciesContracts.PricingPolicy, 200>(
        toContractPricingPolicy(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("PricingPolicyNotFound", () =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 404>({
            error: pricingPolicyErrorMessages.PRICING_POLICY_NOT_FOUND,
            details: {
              code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_NOT_FOUND,
              pricingPolicyId,
            },
          }, 404)),
        Match.tag("PricingPolicyAlreadyUsed", ({
          reservationCount,
          rentalCount,
          billingRecordCount,
        }) =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 409>({
            error: pricingPolicyErrorMessages.PRICING_POLICY_ALREADY_USED,
            details: {
              code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_ALREADY_USED,
              pricingPolicyId,
              reservationCount,
              rentalCount,
              billingRecordCount,
            },
          }, 409)),
        Match.tag("PricingPolicyInvalidInput", ({ issues }) =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 400>({
            error: pricingPolicyErrorMessages.PRICING_POLICY_INVALID_INPUT,
            details: {
              code: "PRICING_POLICY_INVALID_INPUT",
              issues: issues.map(issue => ({
                path: toContractIssuePath(issue.path),
                message: issue.message,
              })),
            },
          }, 400)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const adminGetActivePricingPolicy: RouteHandler<
  PricingPoliciesRoutes["adminGetActive"]
> = async (c) => {
  const eff = withLoggedCause(
    Effect.flatMap(PricingPolicyQueryServiceTag, service => service.getActive()),
    "GET /v1/admin/pricing-policies/active",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<PricingPoliciesContracts.PricingPolicy, 200>(
        toContractPricingPolicy(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("ActivePricingPolicyNotFound", () =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 404>({
            error: pricingPolicyErrorMessages.ACTIVE_PRICING_POLICY_NOT_FOUND,
            details: {
              code: PricingPolicyErrorCodeSchema.enum.ACTIVE_PRICING_POLICY_NOT_FOUND,
            },
          }, 404)),
        Match.tag("ActivePricingPolicyAmbiguous", ({ pricingPolicyIds }) =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 409>({
            error: pricingPolicyErrorMessages.ACTIVE_PRICING_POLICY_AMBIGUOUS,
            details: {
              code: PricingPolicyErrorCodeSchema.enum.ACTIVE_PRICING_POLICY_AMBIGUOUS,
              pricingPolicyIds: [...pricingPolicyIds],
            },
          }, 409)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const adminActivatePricingPolicy: RouteHandler<
  PricingPoliciesRoutes["adminActivate"]
> = async (c) => {
  const { pricingPolicyId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(PricingPolicyCommandServiceTag, service =>
      service.activatePolicy(pricingPolicyId)),
    "PATCH /v1/admin/pricing-policies/{pricingPolicyId}/activate",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<PricingPoliciesContracts.PricingPolicy, 200>(
        toContractPricingPolicy(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("PricingPolicyNotFound", () =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 404>({
            error: pricingPolicyErrorMessages.PRICING_POLICY_NOT_FOUND,
            details: {
              code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_NOT_FOUND,
              pricingPolicyId,
            },
          }, 404)),
        Match.tag("PricingPolicyMutationWindowClosed", ({
          currentTime,
          timeZone,
          windowStart,
          windowEnd,
        }) =>
          c.json<PricingPoliciesContracts.PricingPolicyErrorResponse, 400>({
            error: pricingPolicyErrorMessages.PRICING_POLICY_MUTATION_WINDOW_CLOSED,
            details: {
              code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_MUTATION_WINDOW_CLOSED,
              currentTime,
              timeZone,
              windowStart,
              windowEnd,
            },
          }, 400)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

export const PricingPoliciesAdminController = {
  adminActivatePricingPolicy,
  adminCreatePricingPolicy,
  adminGetActivePricingPolicy,
  adminGetPricingPolicy,
  adminListPricingPolicies,
  adminUpdatePricingPolicy,
} as const;
