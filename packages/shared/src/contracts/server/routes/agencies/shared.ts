import { z } from "../../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";
import { AgencySummarySchema } from "../../agencies";
import { AccountStatusSchema } from "../../users";

export const AgencyIdParamSchema = z
  .object({
    id: z.uuidv7().openapi({
      description: "Agency identifier",
      example: "019b17bd-d130-7e7d-be69-91ceef7b9003",
    }),
  })
  .openapi("AgencyIdParam", {
    description: "Path params for agency id",
  });

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

export const AgencyDetailResponseSchema = AgencySummarySchema.openapi(
  "AgencyDetailResponse",
  {
    description: "Agency details for admin",
  },
);

export const AgencyErrorCodeSchema = z.enum([
  "AGENCY_NOT_FOUND",
]).openapi("AgencyErrorCode");

export const AgencyErrorDetailSchema = z
  .object({
    code: AgencyErrorCodeSchema,
    agencyId: z.uuidv7().optional(),
  })
  .openapi("AgencyErrorDetail");

export const AgencyErrorResponseSchema = z
  .object({
    error: z.string(),
    details: AgencyErrorDetailSchema,
  })
  .openapi("AgencyErrorResponse");

export const agencyErrorMessages = {
  AGENCY_NOT_FOUND: "Agency not found",
} as const;

export type AgencyListResponse = z.infer<typeof AgencyListResponseSchema>;
export type AgencyDetailResponse = z.infer<typeof AgencyDetailResponseSchema>;
export type AgencyErrorResponse = z.infer<typeof AgencyErrorResponseSchema>;

export {
  PaginationSchema,
  ServerErrorResponseSchema,
};
