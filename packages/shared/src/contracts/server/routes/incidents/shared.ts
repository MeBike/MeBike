import { z } from "../../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";
import { IncidentStatusSchema } from "../../incident/schemas";
import { IncidentSummarySchema } from "../../incident/models";

export const IncidentSortFieldSchema = z.enum(["status", "resolvedAt"]);

export const IncidentIdParamSchema = z
  .object({
    incidentId: z.union([z.uuidv7()]).openapi({
      description: "Incident identifier",
      example: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
    }),
  })
  .openapi("IncidentIdParam", {
    description: "Path params for incident id",
  });

export const IncidentListQuerySchema = z
  .object({
    stationId: z.uuidv7().optional(),
    status: IncidentStatusSchema.optional(),
    ...paginationQueryFields,
    sortBy: IncidentSortFieldSchema.optional().openapi({
      description: "Sort field",
      example: "status",
    }),
    sortDir: SortDirectionSchema.optional().openapi({
      description: "Sort direction",
      example: "asc",
    }),
  })
  .openapi("IncidentListQuery", {
    description: "Optional filters for listing incidents",
  });

export const IncidentCreateBodySchema = z
  .object({
    bikeId: z.uuidv7(),
    stationId: z.uuidv7().optional(),
    rentalId: z.uuidv7().optional(),
    incidentType: z.string().max(250),
    description: z.string().max(250).optional(),
    latitude: z.number().min(-90).max(90).openapi({
      description: "Latitude of the incident",
      example: 10.7769,
    }),
    longitude: z.number().min(-180).max(180).openapi({
      description: "Longitude of the incident",
      example: 106.7009,
    }),
    fileUrls: z.array(z.url()).optional(),
  })
  .openapi("IncidentCreateBody", {
    description: "Payload for creating an incident",
  });

export const IncidentUpdateBodySchema =
  IncidentCreateBodySchema.partial().openapi("IncidentUpdateBody", {
    description: "Payload for updating an incident",
  });

export const IncidentStatusPatchSchema = z
  .object({
    status: IncidentStatusSchema,
  })
  .openapi("IncidentStatusPatch", {
    description: "Payload for changing incident status",
  });

export const IncidentListResponseSchema = z
  .object({
    data: IncidentSummarySchema.array(),
    pagination: PaginationSchema,
  })
  .openapi("IncidentListResponse", {
    description: "Paginated incident listing",
  });

export { PaginationSchema, ServerErrorResponseSchema, IncidentSummarySchema };

export type IncidentListResponse = z.infer<typeof IncidentListResponseSchema>;
