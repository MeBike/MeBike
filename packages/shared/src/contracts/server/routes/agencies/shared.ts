import { z } from "../../../../zod";
import {
  OptionalPhoneNumberNullableSchema,
  OptionalTrimmedNullableStringSchema,
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

export const UpdateAgencyBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    address: OptionalTrimmedNullableStringSchema,
    contactPhone: OptionalPhoneNumberNullableSchema,
    status: AccountStatusSchema.optional(),
  })
  .refine(
    value =>
      value.name !== undefined
      || value.address !== undefined
      || value.contactPhone !== undefined
      || value.status !== undefined,
    {
      message: "At least one field must be provided",
    },
  )
  .openapi("UpdateAgencyBody", {
    description: "Patch payload for updating an agency",
    example: {
      name: "Metro Agency Thu Duc",
      address: "12 Vo Van Ngan, Thu Duc, TP.HCM",
      contactPhone: "0912345678",
      status: "ACTIVE",
    },
  });

export const UpdateAgencyStatusBodySchema = z
  .object({
    status: AccountStatusSchema,
  })
  .openapi("UpdateAgencyStatusBody", {
    description: "Patch payload for updating an agency status",
    example: {
      status: "SUSPENDED",
    },
  });

export const AgencyUpdateResponseSchema = AgencySummarySchema.openapi(
  "AgencyUpdateResponse",
  {
    description: "Updated agency details for admin",
  },
);

export const AgencyUpdateStatusResponseSchema = AgencySummarySchema.openapi(
  "AgencyUpdateStatusResponse",
  {
    description: "Updated agency details after status change",
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
export type UpdateAgencyBody = z.infer<typeof UpdateAgencyBodySchema>;
export type UpdateAgencyStatusBody = z.infer<typeof UpdateAgencyStatusBodySchema>;
export type AgencyUpdateResponse = z.infer<typeof AgencyUpdateResponseSchema>;
export type AgencyUpdateStatusResponse = z.infer<typeof AgencyUpdateStatusResponseSchema>;
export type AgencyErrorResponse = z.infer<typeof AgencyErrorResponseSchema>;

export {
  PaginationSchema,
  ServerErrorResponseSchema,
};
