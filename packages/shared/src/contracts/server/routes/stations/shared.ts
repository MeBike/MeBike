import { z } from "../../../../zod";
import { ServerErrorResponseSchema } from "../../schemas";
import {
  BikeRevenueResponseSchema,
  HighestRevenueStationSchema,
  NearestAvailableBikeSchema,
  StationAlertsResponseSchema,
  StationDateRangeQuerySchema,
  StationErrorCodeSchema,
  StationErrorDetailSchema,
  StationRevenueResponseSchema,
  StationStatsResponseSchema,
  StationSummarySchema,
} from "../../stations";

export const StationErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: StationErrorDetailSchema.optional(),
}).openapi("StationErrorResponse", {
  description: "Standard error payload for station endpoints",
});

export const StationIdParamSchema = z
  .object({
    stationId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "Station identifier",
    }),
  })
  .openapi("StationIdParam", {
    description: "Path params for station id",
  });

export const StationListQuerySchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    capacity: z.number().optional(),
  })
  .openapi("StationListQuery", {
    description: "Optional filters for listing stations",
  });

export const NearbyStationsQuerySchema = z
  .object({
    latitude: z.number().openapi({ example: 10.762622 }),
    longitude: z.number().openapi({ example: 106.660172 }),
    maxDistance: z.number().optional().openapi({
      description: "Max distance in meters",
      example: 20000,
    }),
  })
  .openapi("NearbyStationsQuery", {
    description: "Coordinates for nearby/nearest station searches",
  });

export const StationRevenueQuerySchema = StationDateRangeQuerySchema.openapi(
  "StationRevenueQuery",
  {
    description: "Optional date range filters for revenue/statistics endpoints",
  },
);

export const StationSummarySchemaOpenApi = StationSummarySchema.openapi(
  "StationSummary",
  {
    description: "Basic station info",
  },
);

export const StationListResponseSchema = z
  .object({
    data: z.array(StationSummarySchemaOpenApi),
  })
  .openapi("StationListResponse", {
    description: "Simplified station listing",
  });

export const StationStatsResponseSchemaOpenApi = StationStatsResponseSchema.openapi(
  "StationStatsResponse",
  {
    description: "Statistics for a single station in a period",
  },
);

export const StationRevenueResponseSchemaOpenApi
  = StationRevenueResponseSchema.openapi("StationRevenueResponse", {
    description: "Revenue metrics grouped by station (and bikes per station)",
  });

export const BikeRevenueResponseSchemaOpenApi = BikeRevenueResponseSchema.openapi(
  "BikeRevenueResponse",
  {
    description: "Revenue grouped by station and bikes",
  },
);

export const HighestRevenueStationSchemaOpenApi
  = HighestRevenueStationSchema.openapi("HighestRevenueStationResponse", {
    description: "Top station by revenue (may be null if no data)",
  });

export const NearestAvailableBikeSchemaOpenApi
  = NearestAvailableBikeSchema.openapi("NearestAvailableBikeResponse", {
    description: "Nearest available bike result",
  });

export const StationAlertsResponseSchemaOpenApi
  = StationAlertsResponseSchema.openapi("StationAlertsResponse", {
    description: "Alert summary for stations",
  });

export {
  StationDateRangeQuerySchema,
  StationErrorCodeSchema,
};
