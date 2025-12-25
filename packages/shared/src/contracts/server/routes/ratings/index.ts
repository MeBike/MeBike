import { ratingsRoutes as definitions } from "../../ratings/routes";

export * from "../../ratings/routes";

export const ratingsRoutes = {
  ...definitions,
} as const;
