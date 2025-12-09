import { z } from "../../../zod";

export const stationErrorCodes = [
  "STATION_NOT_FOUND",
  "STATION_NAME_ALREADY_EXISTS",
  "CANNOT_DELETE_STATION_WITH_BIKES",
  "NO_AVAILABLE_BIKE_FOUND",
  "INVALID_DATE_FORMAT",
  "INVALID_DATE_RANGE",
] as const;

export const StationErrorCodeSchema = z.enum(stationErrorCodes);

export const StationErrorDetailSchema = z
  .object({
    code: StationErrorCodeSchema,
    stationId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .openapi({
    description: "Station-specific error detail",
    example: {
      code: "STATION_NOT_FOUND",
      stationId: "665fd6e36b7e5d53f8f3d2c9",
    },
  });

export type StationErrorCode = (typeof stationErrorCodes)[number];
export type StationErrorDetail = z.infer<typeof StationErrorDetailSchema>;
