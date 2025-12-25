import { usersRoutes as definitions } from "../../users/routes";

export * from "../../users/routes";

export const usersRoutes = {
  ...definitions,
} as const;
