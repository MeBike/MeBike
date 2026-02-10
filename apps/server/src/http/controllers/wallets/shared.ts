import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  WalletsContracts,
} from "@mebike/shared";

export type WalletsRoutes = typeof import("@mebike/shared")["serverRoutes"]["wallets"];
export type StripeRoutes = typeof import("@mebike/shared")["serverRoutes"]["stripe"];

export const { WalletErrorCodeSchema, walletErrorMessages } = WalletsContracts;

export const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;
