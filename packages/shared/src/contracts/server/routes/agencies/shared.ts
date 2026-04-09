import { z } from "../../../../zod";
import {
  OptionalPhoneNumberNullableSchema,
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";
import {
  AgencyOperationalStatsSchema,
  AgencySummarySchema,
} from "../../agencies";
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
    stationAddress: z.string().min(1).optional(),
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

export const AgencyStatsQuerySchema = z
  .object({
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.from && !value.to) || (!value.from && value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [value.from ? "to" : "from"],
        message: "from and to must be provided together",
      });
    }

    if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "from must not be after to",
      });
    }
  })
  .openapi("AgencyStatsQuery", {
    description:
      "Optional ISO datetime range for agency operational metrics. Provide both from and to, or omit both to use the default rolling 30-day window.",
    example: {
      from: "2026-03-01T00:00:00.000Z",
      to: "2026-03-31T23:59:59.999Z",
    },
  });

export const AgencyOperationalStatsResponseSchema = AgencyOperationalStatsSchema.openapi(
  "AgencyOperationalStatsResponse",
  {
    description: "Operational statistics for an agency",
  },
);

export const UpdateAgencyBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    contactPhone: OptionalPhoneNumberNullableSchema,
    status: AccountStatusSchema.optional(),
  })
  .refine(
    value =>
      value.name !== undefined
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
export type AgencyStatsQuery = z.infer<typeof AgencyStatsQuerySchema>;
export type AgencyOperationalStatsResponse = z.infer<typeof AgencyOperationalStatsResponseSchema>;
export type UpdateAgencyBody = z.infer<typeof UpdateAgencyBodySchema>;
export type UpdateAgencyStatusBody = z.infer<typeof UpdateAgencyStatusBodySchema>;
export type AgencyUpdateResponse = z.infer<typeof AgencyUpdateResponseSchema>;
export type AgencyUpdateStatusResponse = z.infer<typeof AgencyUpdateStatusResponseSchema>;
export type AgencyErrorResponse = z.infer<typeof AgencyErrorResponseSchema>;

export {
  PaginationSchema,
  ServerErrorResponseSchema,
};
