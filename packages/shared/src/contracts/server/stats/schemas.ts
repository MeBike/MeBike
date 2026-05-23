import { z } from "../../../zod";
import { StatsSummarySchema, ReservationForecastSchema } from "./models";

export const StatsSummaryResponseSchema = StatsSummarySchema.openapi("StatsSummaryResponse");
export const ReservationForecastResponseSchema = ReservationForecastSchema.openapi("ReservationForecastResponse");

export const ReservationForecastQuerySchema = z.object({
  startHour: z.coerce
    .number()
    .int()
    .min(5, "Start hour must be between 5 and 23")
    .max(23, "Start hour must be between 5 and 23")
    .optional()
    .openapi({
      description: "Start hour for custom window (5-23)",
      example: 15,
    }),
  endHour: z.coerce
    .number()
    .int()
    .min(5, "End hour must be between 5 and 23")
    .max(23, "End hour must be between 5 and 23")
    .optional()
    .openapi({
      description: "End hour for custom window (5-23)",
      example: 19,
    }),
}).refine(
  (data) => (data.startHour === undefined) === (data.endHour === undefined),
  {
    message: "Both startHour and endHour must be specified together",
    path: ["endHour"],
  }
).refine(
  (data) => {
    if (data.startHour !== undefined && data.endHour !== undefined) {
      return data.startHour < data.endHour;
    }
    return true;
  },
  {
    message: "startHour must be strictly less than endHour",
    path: ["endHour"],
  }
).openapi("ReservationForecastQuery");

export const StatsErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: z.string(),
  }),
}).openapi("StatsErrorResponse");

export type StatsSummaryResponse = z.infer<typeof StatsSummaryResponseSchema>;
export type ReservationForecastResponse = z.infer<typeof ReservationForecastResponseSchema>;

