import { Effect, Layer } from "effect";

import { CouponCommandRepository } from "../repository/coupon-command.repository";
import { makeCouponCommandService } from "./coupon-command.service";

export type { CouponCommandService } from "./coupon.service.types";

const makeCouponCommandServiceEffect = Effect.gen(function* () {
  const repo = yield* CouponCommandRepository;
  return makeCouponCommandService(repo);
});

export class CouponCommandServiceTag extends Effect.Service<CouponCommandServiceTag>()(
  "CouponCommandService",
  {
    effect: makeCouponCommandServiceEffect,
  },
) {}

export const CouponCommandServiceLive = Layer.effect(
  CouponCommandServiceTag,
  makeCouponCommandServiceEffect.pipe(
    Effect.map(CouponCommandServiceTag.make),
  ),
);
