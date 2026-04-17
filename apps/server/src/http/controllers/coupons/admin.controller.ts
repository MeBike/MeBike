import type { RouteHandler } from "@hono/zod-openapi";
import type { CouponsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import {
  CouponCommandServiceTag,
  CouponQueryServiceTag,
} from "@/domain/coupons";
import { withLoggedCause } from "@/domain/shared";
import { toContractAdminCouponRule } from "@/http/presenters/coupons.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { CouponRulesRoutes } from "./shared";

const adminCreateCouponRule: RouteHandler<
  CouponRulesRoutes["adminCreateCouponRule"]
> = async (c) => {
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.flatMap(CouponCommandServiceTag, service =>
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
      })),
    "POST /v1/admin/coupon-rules",
  );

  const created = await c.var.runPromise(eff);

  return c.json<CouponsContracts.AdminCouponRule, 201>(
    toContractAdminCouponRule(created),
    201,
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
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

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
        Match.orElse(() => {
          throw left;
        }),
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

export const CouponRulesAdminController = {
  adminActivateCouponRule,
  adminCreateCouponRule,
  adminDeactivateCouponRule,
  adminUpdateCouponRule,
  adminListCouponRules,
} as const;
