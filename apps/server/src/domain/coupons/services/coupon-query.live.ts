import { Effect, Layer } from "effect";

import { CouponQueryRepository } from "../repository/coupon-query.repository";
import { makeCouponQueryService } from "./coupon-query.service";

export type { CouponQueryService } from "./coupon.service.types";

const makeCouponQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* CouponQueryRepository;
  return makeCouponQueryService(repo);
});

export class CouponQueryServiceTag extends Effect.Service<CouponQueryServiceTag>()(
  "CouponQueryService",
  {
    effect: makeCouponQueryServiceEffect,
  },
) {}

export const CouponQueryServiceLive = Layer.effect(
  CouponQueryServiceTag,
  makeCouponQueryServiceEffect.pipe(Effect.map(CouponQueryServiceTag.make)),
);
