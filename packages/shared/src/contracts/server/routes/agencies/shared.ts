import { z } from "../../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";
import { AgencySummarySchema } from "../../agencies";
import { AccountStatusSchema } from "../../users";

export const AgencySortFieldSchema = z.enum(["name", "status", "createdAt", "updatedAt"]);

export const AgencyListQuerySchema = z
  .object({
    name: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    contactPhone: z.string().min(1).optional(),
    status: AccountStatusSchema.optional(),
    ...paginationQueryFields,
    sortBy: AgencySortFieldSchema.optional().openapi({
      description: "Sort field",
      example: "name",
    }),
    sortDir: SortDirectionSchema.optional().openapi({
      description: "Sort direction",
      example: "asc",
    }),
  })
  .openapi("AgencyListQuery", {
    description: "Optional filters for listing agencies",
  });

export const AgencyListResponseSchema = z
  .object({
    data: AgencySummarySchema.array(),
    pagination: PaginationSchema,
  })
  .openapi("AgencyListResponse", {
    description: "Paginated agency listing for admin",
  });

export type AgencyListResponse = z.infer<typeof AgencyListResponseSchema>;

export {
  PaginationSchema,
  ServerErrorResponseSchema,
};
