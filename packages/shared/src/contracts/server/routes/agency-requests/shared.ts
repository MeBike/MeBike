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

export const AgencyRequestIdParamSchema = z
  .object({
    id: z.uuidv7().openapi({
      description: "Agency request identifier",
      example: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301",
    }),
  })
  .openapi("AgencyRequestIdParam", {
    description: "Path params for agency request id",
  });

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

export const AgencyRequestDetailResponseSchema = AdminAgencyRequestListItemSchema.openapi(
  "AgencyRequestDetailResponse",
  {
    description: "Detailed agency request for admin review",
  },
);

export const AgencyRequestErrorCodeSchema = z.enum([
  "AGENCY_REQUEST_NOT_FOUND",
]).openapi("AgencyRequestErrorCode");

export const AgencyRequestErrorDetailSchema = z
  .object({
    code: AgencyRequestErrorCodeSchema,
    agencyRequestId: z.uuidv7().optional(),
  })
  .openapi("AgencyRequestErrorDetail");

export const AgencyRequestErrorResponseSchema = z
  .object({
    error: z.string(),
    details: AgencyRequestErrorDetailSchema,
  })
  .openapi("AgencyRequestErrorResponse");

export const agencyRequestErrorMessages = {
  AGENCY_REQUEST_NOT_FOUND: "Agency request not found",
} as const;

export {
  PaginationSchema,
  ServerErrorResponseSchema,
};

export type AgencyRequestListResponse = z.infer<typeof AgencyRequestListResponseSchema>;
export type AgencyRequestDetailResponse = z.infer<typeof AgencyRequestDetailResponseSchema>;
export type AgencyRequestErrorResponse = z.infer<typeof AgencyRequestErrorResponseSchema>;
