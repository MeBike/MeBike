import { z } from "../../../../zod";
import {
  IncidentDetailSchema,
  IncidentSummarySchema,
} from "../../incidents/models";
import {
  AssignmentStatusSchema,
  IncidentStatusSchema,
} from "../../incidents/schemas";
import {
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";

export const IncidentSortFieldSchema = z.enum(["status", "resolvedAt"]);

const IncidentStatusesQuerySchema = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map(status => status.trim())
        .filter(Boolean);
    }

    return value;
  }, z.array(IncidentStatusSchema).min(1))
  .optional()
  .openapi({
    example: ["OPEN", "ASSIGNED", "IN_PROGRESS"],
    description: "Filter by multiple incident statuses using repeated query params or a comma-separated string.",
  });

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
    rentalId: z.uuidv7().optional(),
    stationId: z.uuidv7().optional(),
    status: IncidentStatusSchema.optional(),
    statuses: IncidentStatusesQuerySchema,
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

const incidentCreateBase = z.object({
  bikeId: z.uuidv7().optional(),
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
});

export const UploadIncidentImagesRequestSchema = z.object({
  files: z.any().openapi({
    type: "array",
    items: {
      type: "string",
      format: "binary",
    },
  }),
}).openapi("UploadIncidentImagesRequest");

export const UploadIncidentImagesResponseSchema = z.object({
  fileUrls: z.array(z.url()),
}).openapi("UploadIncidentImagesResponse", {
  description: "Uploaded incident image URLs",
});

export const IncidentCreateBodySchema = incidentCreateBase
  .refine(data => data.bikeId || data.rentalId, {
    message: "Either bikeId or rentalId must be provided",
    path: ["bikeId"],
  })
  .openapi("IncidentCreateBody", {
    description: "Payload for creating an incident",
  });

export const IncidentUpdateBodySchema = incidentCreateBase
  .omit({
    bikeId: true,
    rentalId: true,
    stationId: true,
  })
  .partial()
  .openapi("IncidentUpdateBody", {
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
    data: IncidentDetailSchema.array(),
    pagination: PaginationSchema,
  })
  .openapi("IncidentListResponse", {
    description: "Paginated incident listing",
  });

export const IncidentAssignmentStatusPatchSchema = z
  .object({
    status: AssignmentStatusSchema,
  })
  .openapi("IncidentAssignmentStatusPatch", {
    description: "Payload for changing incident assignment status",
  });

export {
  IncidentDetailSchema,
  IncidentSummarySchema,
  PaginationSchema,
  ServerErrorResponseSchema,
};

export type IncidentListResponse = z.infer<typeof IncidentListResponseSchema>;
export type UploadIncidentImagesResponse = z.infer<typeof UploadIncidentImagesResponseSchema>;
