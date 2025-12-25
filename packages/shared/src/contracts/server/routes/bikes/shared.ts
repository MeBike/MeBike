import { z } from "../../../../zod";
import {
  BikeActivityStatsSchema,
  BikeErrorCodeSchema,
  BikeErrorDetailSchema,
  BikeRentalHistoryItemSchema,
  BikeRentalStatsSchema,
  BikeStatusSchema,
  BikeSummarySchema,
  HighestRevenueBikeSchema,
} from "../../bikes";
import {
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";

export {
  BikeErrorCodeSchema,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
};

export const BikeSortFieldSchema = z.enum(["status", "name"]);
export const BikeRentalHistorySortFieldSchema = z.enum([
  "endTime",
  "startTime",
  "totalPrice",
  "duration",
]);

export const BikeErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: BikeErrorDetailSchema.optional(),
}).openapi("BikeErrorResponse", {
  description: "Standard error payload for bike endpoints",
});

export const BikeIdParamSchema = z
  .object({
    id: z.uuidv7().describe("Bike ID (UUID)"),
  })
  .openapi("BikeIdParam", {
    description: "Path params for bike id",
  });

export const BikeListQuerySchema = z
  .object({
    id: z.uuidv7().optional(),
    stationId: z.uuidv7().optional(),
    supplierId: z.uuidv7().optional(),
    status: BikeStatusSchema.optional(),
    ...paginationQueryFields,
    sortBy: BikeSortFieldSchema.optional().openapi({
      description: "Sort field",
      example: "status",
    }),
    sortDir: SortDirectionSchema.optional().openapi({
      description: "Sort direction",
      example: "desc",
    }),
  })
  .openapi("BikeListQuery", {
    description: "Optional filters for listing bikes",
  });

export const BikeRentalHistoryQuerySchema = z
  .object({
    ...paginationQueryFields,
    sortBy: BikeRentalHistorySortFieldSchema.optional().openapi({
      description: "Sort field",
      example: "endTime",
    }),
    sortDir: SortDirectionSchema.optional().openapi({
      description: "Sort direction",
      example: "desc",
    }),
  })
  .openapi("BikeRentalHistoryQuery", {
    description: "Pagination for rental history",
  });

export const CreateBikeBodySchema = z.object({
  chipId: z.string().min(1),
  stationId: z.uuidv7(),
  supplierId: z.uuidv7(),
  status: BikeStatusSchema.optional(),
}).openapi("CreateBikeBody");

export const UpdateBikeBodySchema = z.object({
  chipId: z.string().optional(),
  stationId: z.uuidv7().optional(),
  supplierId: z.uuidv7().optional(),
  status: BikeStatusSchema.optional(),
}).openapi("UpdateBikeBody");

export const BikeSummarySchemaOpenApi = BikeSummarySchema.openapi("BikeSummary", {
  description: "Bike summary details",
});

export const BikeListResponseSchema = z
  .object({
    data: BikeSummarySchema.array(),
    pagination: PaginationSchema,
  })
  .openapi("BikeListResponse", {
    description: "Paginated bike listing",
  });

export const BikeActivityStatsSchemaOpenApi = BikeActivityStatsSchema.openapi(
  "BikeActivityStats",
  { description: "Activity stats for a bike" },
);

export const BikeRentalStatsSchemaOpenApi = BikeRentalStatsSchema.openapi(
  "BikeRentalStats",
  { description: "Overall bike rental stats" },
);

export const HighestRevenueBikeSchemaOpenApi = HighestRevenueBikeSchema.openapi(
  "HighestRevenueBike",
  { description: "Bike with highest revenue" },
);

export const BikeRentalHistoryResponseSchema = z
  .object({
    data: BikeRentalHistoryItemSchema.array(),
    pagination: PaginationSchema,
  })
  .openapi("BikeRentalHistoryResponse", {
    description: "Paginated rental history for a bike",
  });
