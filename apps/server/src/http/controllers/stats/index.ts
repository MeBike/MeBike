import { getReservationForecast } from "./reservation-forecast.controller";
import { getSummary } from "./summary.controller";

export const StatsController = {
  getSummary,
  getReservationForecast,
} as const;

