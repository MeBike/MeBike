import { walletsRoutes as definitions } from "../../wallets/routes";

export * from "../../wallets/routes";

export const walletsRoutes = {
  ...definitions,
} as const;
