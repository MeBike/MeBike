import { createRoute } from "@hono/zod-openapi";

import { unauthorizedResponse } from "../helpers";
import {
  IncidentCreateBodySchema,
  IncidentDetailSchema,
  IncidentIdParamSchema,
  IncidentStatusPatchSchema,
  IncidentSummarySchema,
  IncidentUpdateBodySchema,
} from "./shared";
import {
  IncidentErrorCodeSchema,
  IncidentErrorResponseSchema,
} from "../../incident/errors";

export const createIncident = createRoute({
  method: "post",
  path: "/v1/incidents",
  tags: ["Incidents"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: IncidentCreateBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Incident created",
      content: {
        "application/json": { schema: IncidentSummarySchema },
      },
    },
    400: {
      description: "Invalid payload",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
          examples: {
            BikeNotAvailable: {
              value: {
                error: "Bike not available",
                details: {
                  code: IncidentErrorCodeSchema.enum.BIKE_NOT_AVAILABLE,
                  bikeId: "665fd6e36b7e5d53f8f3d2c9",
                  status: "UNAVAILABLE",
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Rental not found",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
          examples: {
            RentalNotFound: {
              value: {
                error: "Rental not found",
                details: {
                  code: IncidentErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
            BikeNotFound: {
              value: {
                error: "Bike not found",
                details: {
                  code: IncidentErrorCodeSchema.enum.BIKE_NOT_FOUND,
                  bikeId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
            StationNotFound: {
              value: {
                error: "Station not found",
                details: {
                  code: IncidentErrorCodeSchema.enum.STATION_NOT_FOUND,
                  stationId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
            NoNearestStationFound: {
              value: {
                error: "No nearest station found",
                details: {
                  code: IncidentErrorCodeSchema.enum.NO_NEAREST_STATION_FOUND,
                  latitude: 10.8231,
                  longitude: 106.6297,
                },
              },
            },
            NoAvailableTechnicianFound: {
              value: {
                error: "No available technician found",
                details: {
                  code: IncidentErrorCodeSchema.enum
                    .NO_AVAILABLE_TECHNICIAN_FOUND,
                  latitude: 10.8231,
                  longitude: 106.6297,
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const updateIncident = createRoute({
  method: "put",
  path: "/v1/incidents/{incidentId}",
  tags: ["Incidents"],
  security: [{ bearerAuth: [] }],
  request: {
    params: IncidentIdParamSchema,
    body: {
      content: {
        "application/json": { schema: IncidentUpdateBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Incident updated",
      content: {
        "application/json": { schema: IncidentDetailSchema },
      },
    },
    400: {
      description: "Invalid payload",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Unauthorized incident access",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
          examples: {
            UnauthorizedIncidentAccess: {
              value: {
                error: "Unauthorized incident access",
                details: {
                  code: IncidentErrorCodeSchema.enum
                    .UNAUTHORIZED_INCIDENT_ACCESS,
                  incidentId: "665fd6e36b7e5d53f8f3d2c9",
                  userId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Incident not found",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const updateIncidentStatus = createRoute({
  method: "patch",
  path: "/v1/incidents/{incidentId}",
  tags: ["Incidents"],
  security: [{ bearerAuth: [] }],
  request: {
    params: IncidentIdParamSchema,
    body: {
      content: {
        "application/json": { schema: IncidentStatusPatchSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Supplier status updated",
      content: {
        "application/json": { schema: IncidentDetailSchema },
      },
    },
    400: {
      description: "Invalid status",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Incident not found",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Unauthorized incident access",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
          examples: {
            UnauthorizedIncidentAccess: {
              value: {
                error: "Unauthorized incident access",
                details: {
                  code: IncidentErrorCodeSchema.enum
                    .UNAUTHORIZED_INCIDENT_ACCESS,
                  incidentId: "665fd6e36b7e5d53f8f3d2c9",
                  userId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const incidentsMutations = {
  createIncident,
  updateIncident,
  updateIncidentStatus,
} as const;
