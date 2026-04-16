import type { RouteHandler } from "@hono/zod-openapi";
import type { CouponsContracts } from "@mebike/shared";

import { Effect, Match, Option } from "effect";

import { CouponQueryServiceTag } from "@/domain/coupons";
import { withLoggedCause } from "@/domain/shared";
import {
  toUserCouponDetail,
  toUserCouponListItem,
} from "@/http/presenters/coupons.presenter";

import type { CouponsRoutes } from "./shared";

import {
  CouponErrorCodeSchema,
  couponErrorMessages,
  unauthorizedBody,
} from "./shared";

const getCoupon: RouteHandler<CouponsRoutes["getCoupon"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const { userCouponId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(CouponQueryServiceTag, service =>
      service.getForUserById(userId, userCouponId)),
    "GET /v1/coupons/{userCouponId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      Option.isSome(right)
        ? c.json<CouponsContracts.CouponDetailResponse, 200>(
            toUserCouponDetail(right.value),
            200,
          )
        : c.json<CouponsContracts.CouponErrorResponse, 404>({
            error: couponErrorMessages.COUPON_NOT_FOUND,
            details: { code: CouponErrorCodeSchema.enum.COUPON_NOT_FOUND },
          }, 404)),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

const listCoupons: RouteHandler<CouponsRoutes["listCoupons"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const query = c.req.valid("query");
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;

  const eff = withLoggedCause(
    Effect.flatMap(CouponQueryServiceTag, service =>
      service.listForUser(userId, { status: query.status }, { page, pageSize })),
    "GET /v1/coupons",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<CouponsContracts.ListCouponsResponse, 200>({
        data: right.items.map(toUserCouponListItem),
        pagination: {
          page: right.page,
          pageSize: right.pageSize,
          total: right.total,
          totalPages: right.totalPages,
        },
      }, 200)),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

export const CouponMeController = {
  getCoupon,
  listCoupons,
} as const;
