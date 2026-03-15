import { getStatsSummaryRoute } from "./queries";

export * from "../../stats/schemas";
export * from "./queries";

export const statsRoutes = {
  getSummary: getStatsSummaryRoute,
} as const;
