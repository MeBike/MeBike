import type { RouteHandler } from "@hono/zod-openapi";
import {
  serverRoutes,
  type CouponsContracts,
} from "@mebike/shared";

import { Effect, Match } from "effect";

import {
  CouponCommandServiceTag,
  CouponQueryServiceTag,
} from "@/domain/coupons";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractAdminCouponRule,
  toContractAdminCouponStats,
  toContractAdminCouponUsageLog,
} from "@/http/presenters/coupons.presenter";
import { toContractPage } from "@/http/shared/pagination";
import { routeContext } from "@/http/shared/route-context";

import type { CouponRulesRoutes } from "./shared";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const couponRules = serverRoutes.couponRules;

function parseCouponStatsBound(value: string, bound: "from" | "to") {
  if (DATE_ONLY_REGEX.test(value)) {
    return new Date(
      bound === "from"
        ? `${value}T00:00:00.000Z`
        : `${value}T23:59:59.999Z`,
    );
  }

  return new Date(value);
}

const adminCreateCouponRule: RouteHandler<
  CouponRulesRoutes["adminCreateCouponRule"]
> = async (c) => {
  const body = c.req.valid("json");

  const eff = Effect.flatMap(CouponCommandServiceTag, service =>
    service.createAdminCouponRule({
      name: body.name,
      triggerType: body.triggerType,
      minRidingMinutes: body.minRidingMinutes,
      discountType: body.discountType,
      discountValue: body.discountValue,
      priority: body.priority,
      status: body.status,
      activeFrom: body.activeFrom ? new Date(body.activeFrom) : null,
      activeTo: body.activeTo ? new Date(body.activeTo) : null,
    }));

  const result = await c.var.runPromise(
    withLoggedCause(eff, "POST /v1/admin/coupon-rules").pipe(Effect.either),
  );

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<CouponsContracts.AdminCouponRule, 201>(
        toContractAdminCouponRule(right),
        201,
      )),
    Match.tag("Left", ({ left }) => toCouponRuleCommandErrorResponse(c, left)),
    Match.exhaustive,
  );
};

const adminUpdateCouponRule: RouteHandler<
  CouponRulesRoutes["adminUpdateCouponRule"]
> = async (c) => {
  const { ruleId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = Effect.flatMap(CouponCommandServiceTag, service =>
    service.updateAdminCouponRule(ruleId, {
      name: body.name,
      triggerType: body.triggerType,
      minRidingMinutes: body.minRidingMinutes,
      discountType: body.discountType,
      discountValue: body.discountValue,
      priority: body.priority,
      status: body.status,
      activeFrom: body.activeFrom ? new Date(body.activeFrom) : null,
      activeTo: body.activeTo ? new Date(body.activeTo) : null,
    }));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<CouponsContracts.AdminCouponRule, 200>(
        toContractAdminCouponRule(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("CouponRuleNotFound", () =>
          c.json<CouponsContracts.CouponRuleErrorResponse, 404>({
            error: "Coupon rule not found",
            details: {
              code: "COUPON_RULE_NOT_FOUND",
              ruleId,
            },
          }, 404)),
        Match.orElse(err => toCouponRuleCommandErrorResponse(c, err)),
      )),
    Match.exhaustive,
  );
};

function toCouponRuleCommandErrorResponse(
  c: Parameters<RouteHandler<CouponRulesRoutes[keyof CouponRulesRoutes]>>[0],
  error: unknown,
) {
  return Match.value(error).pipe(
    Match.tag("CouponRuleInvalidTier", err =>
      c.json<CouponsContracts.CouponRuleErrorResponse, 400>({
        error: "Coupon rule tier is not allowed",
        details: {
          code: "COUPON_RULE_INVALID_TIER",
          minRidingMinutes: err.minRidingMinutes,
          discountValue: err.discountValue,
        },
      }, 400)),
    Match.tag("CouponRuleInvalidActiveWindow", err =>
      c.json<CouponsContracts.CouponRuleErrorResponse, 400>({
        error: "Coupon rule active window is invalid",
        details: {
          code: "COUPON_RULE_INVALID_ACTIVE_WINDOW",
          activeFrom: err.activeFrom.toISOString(),
          activeTo: err.activeTo.toISOString(),
        },
      }, 400)),
    Match.tag("CouponRuleActiveTierConflict", err =>
      c.json<CouponsContracts.CouponRuleErrorResponse, 409>({
        error: "An active coupon rule already exists for this riding duration tier",
        details: {
          code: "COUPON_RULE_ACTIVE_TIER_CONFLICT",
          minRidingMinutes: err.minRidingMinutes,
          conflictingRuleId: err.conflictingRuleId,
        },
      }, 409)),
    Match.tag("CouponRuleAlreadyUsed", err =>
      c.json<CouponsContracts.CouponRuleErrorResponse, 409>({
        error: "Coupon rule has already been used",
        details: {
          code: "COUPON_RULE_ALREADY_USED",
          ruleId: err.ruleId,
        },
      }, 409)),
    Match.orElse((err) => {
      throw err;
    }),
  );
}

const adminActivateCouponRule: RouteHandler<
  CouponRulesRoutes["adminActivateCouponRule"]
> = async (c) => {
  const { ruleId } = c.req.valid("param");

  const eff = Effect.flatMap(CouponCommandServiceTag, service =>
    service.activateAdminCouponRule(ruleId));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<CouponsContracts.AdminCouponRule, 200>(
        toContractAdminCouponRule(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("CouponRuleNotFound", () =>
          c.json<CouponsContracts.CouponRuleErrorResponse, 404>({
            error: "Coupon rule not found",
            details: {
              code: "COUPON_RULE_NOT_FOUND",
              ruleId,
            },
          }, 404)),
        Match.orElse(err => toCouponRuleCommandErrorResponse(c, err)),
      )),
    Match.exhaustive,
  );
};

const adminDeactivateCouponRule: RouteHandler<
  CouponRulesRoutes["adminDeactivateCouponRule"]
> = async (c) => {
  const { ruleId } = c.req.valid("param");

  const eff = Effect.flatMap(CouponCommandServiceTag, service =>
    service.deactivateAdminCouponRule(ruleId));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<CouponsContracts.AdminCouponRule, 200>(
        toContractAdminCouponRule(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("CouponRuleNotFound", () =>
          c.json<CouponsContracts.CouponRuleErrorResponse, 404>({
            error: "Coupon rule not found",
            details: {
              code: "COUPON_RULE_NOT_FOUND",
              ruleId,
            },
          }, 404)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const adminListCouponRules: RouteHandler<
  CouponRulesRoutes["adminListCouponRules"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(CouponQueryServiceTag, service =>
      service.listAdminCouponRules(
        {
          status: query.status,
          triggerType: query.triggerType,
          discountType: query.discountType,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
        },
      )),
    "GET /v1/admin/coupon-rules",
  );

  const result = await c.var.runPromise(eff);

  return c.json<CouponsContracts.AdminCouponRulesListResponse, 200>({
    data: result.items.map(toContractAdminCouponRule),
    pagination: toContractPage(result),
  }, 200);
};

const adminCouponStats: RouteHandler<
  CouponRulesRoutes["adminCouponStats"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(CouponQueryServiceTag, service =>
      service.getAdminCouponStats({
        from: query.from ? parseCouponStatsBound(query.from, "from") : undefined,
        to: query.to ? parseCouponStatsBound(query.to, "to") : undefined,
      })),
    routeContext(couponRules.adminCouponStats),
  );

  const result = await c.var.runPromise(eff);

  return c.json<CouponsContracts.AdminCouponStatsResponse, 200>(
    toContractAdminCouponStats(result),
    200,
  );
};

const adminCouponUsageLogs: RouteHandler<
  CouponRulesRoutes["adminCouponUsageLogs"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(CouponQueryServiceTag, service =>
      service.listAdminCouponUsageLogs(
        {
          from: query.from ? parseCouponStatsBound(query.from, "from") : undefined,
          to: query.to ? parseCouponStatsBound(query.to, "to") : undefined,
          userId: query.userId,
          rentalId: query.rentalId,
          discountAmount: query.discountAmount,
          subscriptionApplied: query.subscriptionApplied,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
        },
      )),
    routeContext(couponRules.adminCouponUsageLogs),
  );

  const result = await c.var.runPromise(eff);

  return c.json<CouponsContracts.AdminCouponUsageLogsResponse, 200>({
    data: result.items.map(toContractAdminCouponUsageLog),
    pagination: toContractPage(result),
  }, 200);
};

export const CouponRulesAdminController = {
  adminActivateCouponRule,
  adminCouponStats,
  adminCouponUsageLogs,
  adminCreateCouponRule,
  adminDeactivateCouponRule,
  adminUpdateCouponRule,
  adminListCouponRules,
} as const;
