import { Layer } from "effect";

import {
  CouponQueryRepositoryLive,
  CouponQueryServiceLive,
} from "@/domain/coupons";

import { PrismaLive } from "../infra.layers";

export const CouponReposLive = CouponQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const CouponServiceLayer = CouponQueryServiceLive.pipe(
  Layer.provide(CouponReposLive),
);

export const CouponDepsLive = Layer.mergeAll(
  CouponReposLive,
  CouponServiceLayer,
  PrismaLive,
);
