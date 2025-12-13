import { z } from "../../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";
import {
  SupplierBikeStatsSchema,
  SupplierErrorCodeSchema,
  SupplierErrorDetailSchema,
  SupplierErrorResponseSchema,
  SupplierStatusSchema,
  SupplierSummarySchema,
} from "../../suppliers";

export const SupplierSortFieldSchema = z.enum(["name", "status", "updatedAt"]);

export const SupplierIdParamSchema = z
  .object({
    supplierId: z
      .union([z.uuidv7()])
      .openapi({ description: "Supplier identifier", example: "018fa0f9-8f3b-752c-8f3d-2c9000000000" }),
  })
  .openapi("SupplierIdParam", {
    description: "Path params for supplier id",
  });

export const SupplierListQuerySchema = z
  .object({
    name: z.string().optional(),
    status: SupplierStatusSchema.optional(),
    ...paginationQueryFields,
    sortBy: SupplierSortFieldSchema.optional().openapi({
      description: "Sort field",
      example: "name",
    }),
    sortDir: SortDirectionSchema.optional().openapi({
      description: "Sort direction",
      example: "asc",
    }),
  })
  .openapi("SupplierListQuery", {
    description: "Optional filters for listing suppliers",
  });

export const SupplierCreateBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    address: z.string().max(250).optional(),
    phoneNumber: z
      .string()
      .regex(/^\d{10}$/, { message: "phoneNumber must be 10 digits" })
      .optional(),
    contractFee: z.number().optional(),
    status: SupplierStatusSchema.optional(),
  })
  .openapi("SupplierCreateBody", {
    description: "Payload for creating a supplier",
  });

export const SupplierUpdateBodySchema = SupplierCreateBodySchema.partial().openapi(
  "SupplierUpdateBody",
  {
    description: "Payload for updating a supplier",
  },
);

export const SupplierStatusPatchSchema = z
  .object({
    status: SupplierStatusSchema,
  })
  .openapi("SupplierStatusPatch", {
    description: "Payload for changing supplier status",
  });

export const SupplierListResponseSchema = z
  .object({
    data: SupplierSummarySchema.array(),
    pagination: PaginationSchema,
  })
  .openapi("SupplierListResponse", {
    description: "Paginated supplier listing",
  });

export const SupplierStatsListResponseSchema = z
  .object({
    data: SupplierBikeStatsSchema.array(),
  })
  .openapi("SupplierStatsListResponse", {
    description: "Bike stats for all suppliers",
  });

export const SupplierStatsResponseSchema = SupplierBikeStatsSchema.openapi(
  "SupplierStatsResponse",
  {
    description: "Bike stats for one supplier",
  },
);

export {
  PaginationSchema,
  ServerErrorResponseSchema,
  SupplierBikeStatsSchema,
  SupplierErrorCodeSchema,
  SupplierErrorDetailSchema,
  SupplierErrorResponseSchema,
  SupplierStatusSchema,
  SupplierSummarySchema,
};
