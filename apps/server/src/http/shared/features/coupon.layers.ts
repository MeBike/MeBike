import { Layer } from "effect";

import {
  CouponCommandRepositoryLive,
  CouponCommandServiceLive,
  CouponQueryRepositoryLive,
  CouponQueryServiceLive,
} from "@/domain/coupons";

import { PrismaLive } from "../infra.layers";

export const CouponQueryReposLive = CouponQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const CouponCommandReposLive = CouponCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const CouponQueryServiceLayer = CouponQueryServiceLive.pipe(
  Layer.provide(CouponQueryReposLive),
);

export const CouponCommandServiceLayer = CouponCommandServiceLive.pipe(
  Layer.provide(CouponCommandReposLive),
);

export const CouponReposLive = Layer.mergeAll(
  CouponQueryReposLive,
  CouponCommandReposLive,
);

export const CouponServiceLayer = Layer.mergeAll(
  CouponQueryServiceLayer,
  CouponCommandServiceLayer,
);

export const CouponDepsLive = Layer.mergeAll(
  CouponReposLive,
  CouponServiceLayer,
  PrismaLive,
);
