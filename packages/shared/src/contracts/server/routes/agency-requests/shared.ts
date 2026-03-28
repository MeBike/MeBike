import { z } from "../../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";
import {
  AdminAgencyRequestListItemSchema,
  AgencyRequestStatusSchema,
} from "../../agency-requests/models";

export const AgencyRequestSortFieldSchema = z.enum([
  "createdAt",
  "updatedAt",
  "status",
  "requesterEmail",
  "agencyName",
]);

export const AgencyRequestListQuerySchema = z
  .object({
    requesterUserId: z.uuidv7().optional(),
    requesterEmail: z.string().min(1).optional(),
    agencyName: z.string().min(1).optional(),
    status: AgencyRequestStatusSchema.optional(),
    ...paginationQueryFields,
    sortBy: AgencyRequestSortFieldSchema.optional().openapi({
      description: "Sort field",
      example: "createdAt",
    }),
    sortDir: SortDirectionSchema.optional().openapi({
      description: "Sort direction",
      example: "desc",
    }),
  })
  .openapi("AgencyRequestListQuery", {
    description: "Optional filters for listing agency registration requests",
  });

export const AgencyRequestListResponseSchema = z
  .object({
    data: AdminAgencyRequestListItemSchema.array(),
    pagination: PaginationSchema,
  })
  .openapi("AgencyRequestListResponse", {
    description: "Paginated agency request listing for admin review",
  });

export {
  PaginationSchema,
  ServerErrorResponseSchema,
};

export type AgencyRequestListResponse = z.infer<typeof AgencyRequestListResponseSchema>;
