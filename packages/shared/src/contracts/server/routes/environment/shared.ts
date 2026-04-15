import { z } from "../../../../zod";
import {
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  EnvironmentImpactSchema,
  EnvironmentImpactDetailSchema,
  EnvironmentImpactHistoryResponseSchema,
  EnvironmentPolicyListResponseSchema,
  EnvironmentPolicySchema,
  EnvironmentSummarySchema,
} from "../../environment";
import { AccountStatusSchema } from "../../users";

export {
  EnvironmentImpactSchema,
  EnvironmentImpactDetailSchema,
  EnvironmentImpactHistoryResponseSchema,
  EnvironmentPolicyListResponseSchema,
  EnvironmentPolicySchema,
  EnvironmentSummarySchema,
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
};

export const EnvironmentErrorCodeSchema = z.enum([
  "ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND",
  "ENVIRONMENT_IMPACT_NOT_FOUND",
  "ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND",
  "ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED",
  "ENVIRONMENT_POLICY_NOT_FOUND",
  "ENVIRONMENT_POLICY_ACTIVATION_BLOCKED",
]).openapi("EnvironmentErrorCode");

export const environmentErrorMessages = {
  ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND: "No active environment policy found",
  ENVIRONMENT_IMPACT_NOT_FOUND: "Environment impact not found",
  ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND: "Rental not found",
  ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED:
    "Rental must be completed before calculating environment impact",
  ENVIRONMENT_POLICY_NOT_FOUND: "Environment policy not found",
  ENVIRONMENT_POLICY_ACTIVATION_BLOCKED: "Cannot activate suspended or banned environment policy",
} as const;

export const EnvironmentPolicyIdParamsSchema = z.object({
  policyId: z.uuid().openapi({
    description: "Environment Policy UUID",
    example: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
  }),
}).openapi("EnvironmentPolicyIdParams");

export const EnvironmentImpactRentalIdParamsSchema = z.object({
  rentalId: z.uuid().openapi({
    description: "Rental UUID for Environment Impact lookup or calculation",
    example: "018fa0f9-8f3b-752c-8f3d-2c9000000003",
  }),
}).openapi("EnvironmentImpactRentalIdParams");

export const CreateEnvironmentPolicyBodySchema = z.object({
  name: z.string().trim().min(1, {
    message: "name must not be empty",
  }),
  average_speed_kmh: z.number()
    .positive({ message: "average_speed_kmh must be greater than 0" })
    .max(40, { message: "average_speed_kmh must be less than or equal to 40" }),
  co2_saved_per_km: z.number()
    .min(0, { message: "co2_saved_per_km must be greater than or equal to 0" })
    .max(500, { message: "co2_saved_per_km must be less than or equal to 500" }),
  return_scan_buffer_minutes: z.number()
    .int({ message: "return_scan_buffer_minutes must be an integer" })
    .min(0, { message: "return_scan_buffer_minutes must be greater than or equal to 0" })
    .max(30, { message: "return_scan_buffer_minutes must be less than or equal to 30" })
    .optional(),
  confidence_factor: z.number()
    .positive({ message: "confidence_factor must be greater than 0" })
    .max(1, { message: "confidence_factor must be less than or equal to 1" })
    .optional(),
  status: z.literal("INACTIVE").optional(),
}).openapi("CreateEnvironmentPolicyBody", {
  description: "Create an inactive Environment Policy draft for Phase 1 CO2 saved calculation.",
  example: {
    name: "Default Environment Policy v1",
    average_speed_kmh: 12,
    co2_saved_per_km: 75,
    return_scan_buffer_minutes: 3,
    confidence_factor: 0.85,
  },
});

export type CreateEnvironmentPolicyBody = z.infer<
  typeof CreateEnvironmentPolicyBodySchema
>;
export type EnvironmentPolicyResponse = z.infer<typeof EnvironmentPolicySchema>;
export type EnvironmentImpactResponse = z.infer<typeof EnvironmentImpactSchema>;
export type EnvironmentImpactDetailResponse = z.infer<
  typeof EnvironmentImpactDetailSchema
>;
export type EnvironmentImpactHistoryResponse = z.infer<
  typeof EnvironmentImpactHistoryResponseSchema
>;
export type EnvironmentSummaryResponse = z.infer<
  typeof EnvironmentSummarySchema
>;
export type EnvironmentPolicyListResponse = z.infer<
  typeof EnvironmentPolicyListResponseSchema
>;
export type EnvironmentErrorResponse = z.infer<typeof ServerErrorResponseSchema>;

const optionalIntegerQuery = (field: string) =>
  z.preprocess(
    value =>
      value === undefined || value === null
        ? undefined
        : typeof value === "string"
          ? Number(value)
          : value,
    z.number()
      .int({ message: `${field} must be an integer` }),
  );

export const EnvironmentPolicySortFieldSchema = z.enum([
  "created_at",
  "updated_at",
  "active_from",
  "name",
]);

export const EnvironmentPolicySortOrderSchema = z.enum(["asc", "desc"]);
export const EnvironmentImpactHistorySortOrderSchema = z.enum(["asc", "desc"]);

export const ListEnvironmentPoliciesQuerySchema = z.object({
  page: optionalIntegerQuery("page")
    .pipe(z.number().int().min(1, { message: "page must be greater than or equal to 1" }))
    .optional()
    .openapi({
      description: "Page number (1-based). Defaults to 1.",
      example: 1,
    }),
  pageSize: optionalIntegerQuery("pageSize")
    .pipe(z.number().int()
      .min(1, { message: "pageSize must be greater than or equal to 1" })
      .max(100, { message: "pageSize must be less than or equal to 100" }))
    .optional()
    .openapi({
      description: "Number of policies per page. Defaults to 20, max 100.",
      example: 20,
    }),
  status: AccountStatusSchema.optional().openapi({
    description: "Filter policies by account-style policy status.",
    example: "ACTIVE",
  }),
  search: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().optional(),
  ).optional().openapi({
    description: "Case-insensitive search by policy name.",
    example: "default",
  }),
  sortBy: EnvironmentPolicySortFieldSchema.optional().openapi({
    description: "Sort field. Defaults to created_at.",
    example: "created_at",
  }),
  sortOrder: EnvironmentPolicySortOrderSchema.optional().openapi({
    description: "Sort direction. Defaults to desc.",
    example: "desc",
  }),
}).openapi("ListEnvironmentPoliciesQuery", {
  description: "Optional filters, pagination, and sorting for Environment Policy listing.",
});

export type ListEnvironmentPoliciesQuery = z.infer<
  typeof ListEnvironmentPoliciesQuerySchema
>;

const optionalIsoDateOrDateTimeQuery = (field: string) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (typeof value !== "string") {
        return value;
      }
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.union([z.iso.date(), z.iso.datetime()]).optional(),
  ).openapi({
    description: `${field} filter as an ISO date or datetime.`,
    example: "2026-04-15T00:00:00.000Z",
  });

export const ListEnvironmentImpactHistoryQuerySchema = z.object({
  page: optionalIntegerQuery("page")
    .pipe(z.number().int().min(1, { message: "page must be greater than or equal to 1" }))
    .optional()
    .openapi({
      description: "Page number (1-based). Defaults to 1.",
      example: 1,
    }),
  pageSize: optionalIntegerQuery("pageSize")
    .pipe(z.number().int()
      .min(1, { message: "pageSize must be greater than or equal to 1" })
      .max(100, { message: "pageSize must be less than or equal to 100" }))
    .optional()
    .openapi({
      description: "Number of impact records per page. Defaults to 20, max 100.",
      example: 20,
    }),
  sortOrder: EnvironmentImpactHistorySortOrderSchema.optional().openapi({
    description: "Sort direction by calculated_at. Defaults to desc.",
    example: "desc",
  }),
  dateFrom: optionalIsoDateOrDateTimeQuery("dateFrom"),
  dateTo: optionalIsoDateOrDateTimeQuery("dateTo"),
}).superRefine((value, ctx) => {
  if (
    value.dateFrom
    && value.dateTo
    && new Date(value.dateFrom) > new Date(value.dateTo)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateFrom"],
      message: "dateFrom must not be after dateTo",
    });
  }
}).openapi("ListEnvironmentImpactHistoryQuery", {
  description:
    "Optional pagination, sorting, and calculated_at filters for the authenticated user's Environment Impact history.",
});

export type ListEnvironmentImpactHistoryQuery = z.infer<
  typeof ListEnvironmentImpactHistoryQuerySchema
>;
