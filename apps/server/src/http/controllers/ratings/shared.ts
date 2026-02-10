import { RatingsContracts, UnauthorizedErrorCodeSchema, unauthorizedErrorMessages } from "@mebike/shared";

export type RatingsRoutes = typeof import("@mebike/shared")["serverRoutes"]["ratings"];

export const { ratingErrorMessages, RatingErrorCodeSchema } = RatingsContracts;

export const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;
