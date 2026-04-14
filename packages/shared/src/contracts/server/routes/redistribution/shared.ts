import { z } from "../../../../zod";
import {
  RedistributionIsoDateTimeStringSchema,
  RedistributionRequestDetailSchema,
  RedistributionRequestListItemSchema,
  RedistributionRequestSchema,
  CreateRedistributionRequestSchema,
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
  CancelRedistributionRequestSchema,
  RedistributionStatusSchema,
  RejectRedistributionRequestSchema,
  ConfirmRedistributionRequestCompletionSchema,
} from "../../redistribution";
import { paginationQueryFields, PaginationSchema, SortDirectionSchema } from "../../schemas";

export function redistributionRequestDateRangeWith<T extends z.ZodRawShape>(
  extra: T,
) {
  const base = z.object({
    from: RedistributionIsoDateTimeStringSchema.optional(),
    to: RedistributionIsoDateTimeStringSchema.optional(),
    ...extra,
  });

  return base.refine(
    (value: any) =>
      !(value.from && value.to && new Date(value.from) > new Date(value.to)),
    {
      message: "from must not be after to",
      path: ["from"],
    },
  );
}

// Params
export const RedistributionRequestIdParamSchema = z
  .object({
    requestId: z.uuidv7().openapi({
      example: "019b17bd-d130-7e7d-be69-91ceef7b6959",
      description: "Redistribution request identifier",
    }),
  })
  .openapi("RedistributionRequestIdParam", {
    description: "Path params for redistribution request id",
  });

export const UserIdParamSchema = z
  .object({
    userId: z.uuidv7().openapi({
      example: "019b17bd-d130-7e7d-be69-91ceef7b6959",
      description: "User identifier",
    }),
  })
  .openapi("UserIdParam", {
    description: "Path params for user id",
  });

// Query
const RedistributionRequestListQueryBaseSchema = z.object({
  ...paginationQueryFields,
  sortBy: z.enum(["createdAt", "startedAt", "completedAt"]).optional(),
  sortDir: SortDirectionSchema.optional(),
  status: RedistributionStatusSchema.optional(),
});

export const StaffRedistributionRequestListQuerySchema = 
  redistributionRequestDateRangeWith({
    ...RedistributionRequestListQueryBaseSchema.shape,
    targetStationId: z.uuidv7().optional(),
  })
  .openapi("StaffRedistributionRequestListQuery", {
    description: "Query parameter for staff redistribution request list",
  });

export const ManagerRedistributionRequestListQuerySchema = 
  redistributionRequestDateRangeWith({
    ...RedistributionRequestListQueryBaseSchema.shape,
    requestedByUserId: z.uuidv7().optional(),
    approvedByUserId: z.uuidv7().optional(),
    sourceStationId: z.uuidv7().optional(),
    targetStationId: z.uuidv7().optional(),
  })
  .openapi("ManagerRedistributionRequestListQuery", {
    description: "Query parameter for manager redistribution request list",
  });

export const AgencyRedistributionRequestListQuerySchema = 
  redistributionRequestDateRangeWith({
    ...RedistributionRequestListQueryBaseSchema.shape,
    requestedByUserId: z.uuidv7().optional(),
    approvedByUserId: z.uuidv7().optional(),
    sourceStationId: z.uuidv7().optional(),
    targetStationId: z.uuidv7().optional(),
  })
  .openapi("AgencyRedistributionRequestListQuery", {
    description: "Query parameter for agency redistribution request list",
  });

export const AdminRedistributionRequestListQuerySchema = 
  redistributionRequestDateRangeWith({
    ...RedistributionRequestListQueryBaseSchema.shape,
    requestedByUserId: z.uuidv7().optional(),
    approvedByUserId: z.uuidv7().optional(),
    sourceStationId: z.uuidv7().optional(),
    targetStationId: z.uuidv7().optional(),
  })
  .openapi("AdminRedistributionRequestListQuery", {
    description: "Query parameter for admin redistribution request list",
  });

// Queries
export const RedistributionRequestSchemaOpenApi =
  RedistributionRequestSchema.openapi("RedistributionRequest", {
    description: "Basic redistribution request information",
  });

export const RedistributionRequestDetailSchemaOpenApi =
  RedistributionRequestDetailSchema.openapi("RedistributionRequestDetail", {
    description:
      "Detailed redistribution request with populated user, station (or agency), and item data",
  });

export const RedistributionRequestListItemSchemaOpenApi =
  RedistributionRequestListItemSchema.openapi("RedistributionRequestListItem", {
    description: "Redistribution request item for paginated list",
  });

// Mutations
export const CreateRedistributionRequestSchemaOpenApi =
  CreateRedistributionRequestSchema.openapi("CreateRedistributionRequest", {
    description: "Payload for creating redistribution request",
  });

export const CancelRedistributionRequestSchemaOpenApi =
  CancelRedistributionRequestSchema.openapi("CancelRedistributionRequest", {
    description: "Payload for cancelling redistribution request",
  });

export const RejectRedistributionRequestSchemaOpenApi = 
  RejectRedistributionRequestSchema.openapi("RejectRedistributionRequest", {
    description: "Payload for rejecting redistribution request",
  });

export const ConfirmRedistributionRequestCompletionSchemaOpenApi = 
  ConfirmRedistributionRequestCompletionSchema.openapi("ConfirmRedistributionRequestCompletion", {
    description: "Payload for confirming redistribution request completion",
  });

// Response
export const RedistributionRequestListResponseSchema = z
  .object({
    data: z.array(RedistributionRequestListItemSchemaOpenApi),
    pagination: PaginationSchema,
  })
  .openapi("RedistributionRequestListResponse", {
    description: "Paginated redistribution request list",
  });

export {
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestSchema
}