import { z } from "../../../../zod";
import {
  RedistributionIsoDateTimeStringSchema,
  RedistributionRequestDetailSchema,
  RedistributionRequestListItemSchema,
  RedistributionRequestSchema,
  CreateRedistributionRequestSchema,
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
} from "../../redistribution";
import { paginationQueryFields, PaginationSchema } from "../../schemas";

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
    redistributionReqId: z.uuidv7().openapi({
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
export const RedistributionRequestListQuerySchema = z
  .object({
    ...paginationQueryFields,
  })
  .openapi("RedistributionRequestListQuery", {
    description: "Query parameter for redistribution request list",
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

// Response
export const RedistributionRequestListResponseSchema = z
  .object({
    data: z.array(RedistributionRequestListItemSchemaOpenApi),
    pagination: PaginationSchema,
  })
  .openapi("RedistributionRequestListResponse", {
    description: "Paginated redistribution request list",
  });

export function createSuccessResponse<T extends z.ZodType>(
  dataSchema: T,
  description: string,
) {
  return z
    .object({
      message: z.string(),
      result: dataSchema,
    })
    .openapi("SuccessResponse", { description });
}

export {
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestSchema
}