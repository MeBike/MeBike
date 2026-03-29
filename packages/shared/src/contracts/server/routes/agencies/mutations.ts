import { createRoute } from "@hono/zod-openapi";

import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../helpers";

import {
  AgencyErrorCodeSchema,
  AgencyErrorResponseSchema,
  AgencyIdParamSchema,
  AgencyUpdateResponseSchema,
  ServerErrorResponseSchema,
  UpdateAgencyBodySchema,
  agencyErrorMessages,
} from "./shared";

export const adminUpdateAgencyRoute = createRoute({
  method: "patch",
  path: "/v1/admin/agencies/{id}",
  tags: ["Admin", "Agencies"],
  security: [{ bearerAuth: [] }],
  request: {
    params: AgencyIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateAgencyBodySchema,
          examples: {
            UpdateAgencyBasics: {
              value: {
                name: "Metro Agency Thu Duc",
                address: "12 Vo Van Ngan, Thu Duc, TP.HCM",
                contactPhone: "0912345678",
                status: "ACTIVE",
              },
            },
            ClearAddressAndPhone: {
              value: {
                address: null,
                contactPhone: null,
                status: "INACTIVE",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Agency updated successfully",
      content: {
        "application/json": {
          schema: AgencyUpdateResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request payload",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Agency not found",
      schema: AgencyErrorResponseSchema,
      example: {
        error: agencyErrorMessages.AGENCY_NOT_FOUND,
        details: {
          code: AgencyErrorCodeSchema.enum.AGENCY_NOT_FOUND,
          agencyId: "019b17bd-d130-7e7d-be69-91ceef7b9003",
        },
      },
    }),
  },
});
