import { authRoutes as definitions } from "../auth/schemas";

export * from "../auth/schemas";

export const authRoutes = {
  ...definitions,
} as const;
