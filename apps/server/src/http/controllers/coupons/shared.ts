import {
  CouponsContracts,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";

export type CouponsRoutes = typeof import("@mebike/shared")["serverRoutes"]["coupons"];

export const { CouponStatusSchema } = CouponsContracts;

export const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;
