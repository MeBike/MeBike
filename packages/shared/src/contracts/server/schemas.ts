import { z } from "../../zod";

const ValidationIssueSchema = z.object({
  path: z.string().openapi({
    description: "Location of the invalid value (body, query, params, etc.)",
    example: "body.fieldName",
  }).optional(),
  message: z.string().openapi({
    description: "Why the value is invalid",
    example: "fieldName must be an ISO 8601 datetime string",
  }),
  code: z.string().openapi({
    description: "Validator-specific code (e.g. Zod issue code)",
    example: "invalid_string",
  }).optional(),
  expected: z.any().optional(),
  received: z.any().optional(),
});

export const ServerErrorDetailSchema = z
  .object({
    code: z.string().openapi({
      description: "Application specific error code",
      example: "STATION_NOT_FOUND",
    }).optional(),
    issues: z.array(ValidationIssueSchema).openapi({
      description: "Detailed validation issues (for 400 errors)",
    }).optional(),
  })
  .catchall(z.any());

export const ServerErrorResponseSchema = z.object({
  error: z.string().openapi("ServerErrorMessage", {
    example: "Invalid request payload",
  }),
  details: ServerErrorDetailSchema.openapi("ServerErrorDetails", {
    example: {
      code: "VALIDATION_ERROR",
      issues: [
        {
          path: "body.fieldName",
          message: "fieldName must be an ISO 8601 datetime string",
          code: "invalid_string",
        },
      ],
    },
  }).optional(),
}).openapi("ServerErrorResponse", {
  description: "Standard error payload returned by the main backend.",
  example: {
    error: "Invalid request payload",
    details: {
      code: "VALIDATION_ERROR",
      issues: [
        {
          path: "body.fieldName",
          message: "fieldName must be an ISO 8601 datetime string",
          code: "invalid_string",
        },
      ],
    },
  },
});

export type ServerErrorResponse = z.infer<typeof ServerErrorResponseSchema>;
export type ServerErrorDetail = z.infer<typeof ServerErrorDetailSchema>;

export const UnauthorizedErrorCodeSchema = z
  .enum(["UNAUTHORIZED"])
  .openapi("UnauthorizedErrorCode", { description: "Authentication is required" });

export const unauthorizedErrorMessages = {
  UNAUTHORIZED: "Unauthorized",
} as const;

export const UnauthorizedErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: UnauthorizedErrorCodeSchema,
  }),
}).openapi("UnauthorizedErrorResponse", {
  description: "Authentication is required",
  example: {
    error: unauthorizedErrorMessages.UNAUTHORIZED,
    details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
  },
});

export type UnauthorizedErrorResponse = z.infer<typeof UnauthorizedErrorResponseSchema>;

export const SortDirectionSchema = z.enum(["asc", "desc"]);

export const OptionalTrimmedNullableStringSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.string().optional().nullable(),
);

export const PaginationSchema = z
  .object({
    page: z.number().int().positive().openapi({
      description: "Current page number (1-based)",
      example: 1,
    }),
    pageSize: z.number().int().positive().openapi({
      description: "Number of items per page",
      example: 50,
    }),
    total: z.number().int().nonnegative().openapi({
      description: "Total number of items across all pages",
      example: 150,
    }),
    totalPages: z.number().int().nonnegative().openapi({
      description: "Total number of pages",
      example: 3,
    }),
  })
  .openapi("Pagination", {
    description: "Pagination metadata for paginated responses",
  });

export const paginationQueryFields = {
  page: z
    .preprocess(
      v => (typeof v === "string" ? Number(v) : v),
      z.number().int().positive(),
    )
    .optional()
    .openapi({
      description: "Page number (1-based)",
      example: 1,
    }),
  pageSize: z
    .preprocess(
      v => (typeof v === "string" ? Number(v) : v),
      z.number().int().positive(),
    )
    .optional()
    .openapi({
      description: "Page size",
      example: 50,
    }),
};
