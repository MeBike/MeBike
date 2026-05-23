import { getStatsSummaryRoute, getReservationForecastRoute } from "./queries";

export * from "../../stats/schemas";
export * from "./queries";

export const statsRoutes = {
  getSummary: getStatsSummaryRoute,
  getReservationForecast: getReservationForecastRoute,
} as const;
