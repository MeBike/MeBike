import { RedistributionContracts } from "@mebike/shared";

export type RedistributionRoutes = typeof import("@mebike/shared")["serverRoutes"]["redistribution"];

export const {
  RedistributionReqErrorCodeSchema,
  redistributionReqErrorMessages,
} = RedistributionContracts;
