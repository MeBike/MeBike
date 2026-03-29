import { createRoute, z } from "@hono/zod-openapi";

import {
  OptionalPhoneNumberNullableSchema,
  OptionalTrimmedNullableStringSchema,
  ServerErrorResponseSchema,
} from "../../schemas";
import { AgencyRequestSchema } from "../../agency-requests/models";
import { unauthorizedResponse } from "../helpers";
import {
  AgencyRequestErrorCodeSchema,
  AgencyRequestErrorResponseSchema,
  AgencyRequestIdParamSchema,
  agencyRequestErrorMessages,
} from "./shared";

const SubmitAgencyRequestRequestSchema = z.object({
  requesterEmail: z.string().email(),
  requesterPhone: OptionalPhoneNumberNullableSchema,
  agencyName: z.string().min(1),
  agencyAddress: OptionalTrimmedNullableStringSchema,
  agencyContactPhone: OptionalPhoneNumberNullableSchema,
  description: OptionalTrimmedNullableStringSchema,
}).openapi("SubmitAgencyRequestRequest");

const SubmitAgencyRequestResponseSchema = AgencyRequestSchema.openapi("SubmitAgencyRequestResponse");

export const submitAgencyRequestRoute = createRoute({
  method: "post",
  path: "/v1/agency-requests",
  tags: ["Agency Requests"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SubmitAgencyRequestRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Agency request submitted",
      content: {
        "application/json": {
          schema: SubmitAgencyRequestResponseSchema,
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
  },
});

export const cancelAgencyRequestRoute = createRoute({
  method: "post",
  path: "/v1/agency-requests/{id}/cancel",
  tags: ["Agency Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: AgencyRequestIdParamSchema,
  },
  responses: {
    200: {
      description: "Agency request cancelled successfully",
      content: {
        "application/json": {
          schema: AgencyRequestSchema,
        },
      },
    },
    400: {
      description: "Cannot cancel agency request",
      content: {
        "application/json": {
          schema: AgencyRequestErrorResponseSchema,
          examples: {
            NotOwned: {
              value: {
                error: agencyRequestErrorMessages.AGENCY_REQUEST_NOT_OWNED,
                details: {
                  code: AgencyRequestErrorCodeSchema.enum.AGENCY_REQUEST_NOT_OWNED,
                  agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301",
                  userId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd302",
                },
              },
            },
            InvalidTransition: {
              value: {
                error: agencyRequestErrorMessages.INVALID_AGENCY_REQUEST_STATUS_TRANSITION,
                details: {
                  code: AgencyRequestErrorCodeSchema.enum.INVALID_AGENCY_REQUEST_STATUS_TRANSITION,
                  agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301",
                  currentStatus: "APPROVED",
                  nextStatus: "CANCELLED",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Agency request not found",
      content: {
        "application/json": {
          schema: AgencyRequestErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: agencyRequestErrorMessages.AGENCY_REQUEST_NOT_FOUND,
                details: {
                  code: AgencyRequestErrorCodeSchema.enum.AGENCY_REQUEST_NOT_FOUND,
                  agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301",
                },
              },
            },
          },
        },
      },
    },
  },
});

export type SubmitAgencyRequestRequest = z.infer<typeof SubmitAgencyRequestRequestSchema>;
export type SubmitAgencyRequestResponse = z.infer<typeof SubmitAgencyRequestResponseSchema>;
export type CancelAgencyRequestResponse = z.infer<typeof AgencyRequestSchema>;
