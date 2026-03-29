import { createRoute, z } from "@hono/zod-openapi";

import {
  OptionalPhoneNumberNullableSchema,
  OptionalTrimmedNullableStringSchema,
  ServerErrorResponseSchema,
} from "../../schemas";
import { AgencyRequestSchema } from "../../agency-requests/models";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  AgencyRequestDetailResponseSchema,
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
const ApproveAgencyRequestRequestSchema = z.object({
  description: OptionalTrimmedNullableStringSchema,
}).openapi("ApproveAgencyRequestRequest");
const RejectAgencyRequestRequestSchema = z.object({
  reason: OptionalTrimmedNullableStringSchema.openapi({
    description: "Preferred alias for the admin rejection reason",
    example: "Business documents are incomplete.",
  }),
  description: OptionalTrimmedNullableStringSchema.openapi({
    description: "Legacy note field kept for schema compatibility",
    example: "Please resubmit with a valid business license.",
  }),
}).superRefine((value, ctx) => {
  if (value.reason != null || value.description != null) {
    return;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["reason"],
    message: "Either reason or description is required",
  });
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["description"],
    message: "Either reason or description is required",
  });
}).openapi("RejectAgencyRequestRequest");

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

export const approveAgencyRequestRoute = createRoute({
  method: "post",
  path: "/v1/admin/agency-requests/{id}/approve",
  tags: ["Admin", "Agency Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: AgencyRequestIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: ApproveAgencyRequestRequestSchema,
          examples: {
            BasicApproval: {
              value: {
                description: "Approved and agency account has been provisioned.",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Agency request approved and agency account provisioned",
      content: {
        "application/json": {
          schema: AgencyRequestDetailResponseSchema,
        },
      },
    },
    400: {
      description: "Cannot approve agency request",
      content: {
        "application/json": {
          schema: AgencyRequestErrorResponseSchema,
          examples: {
            InvalidTransition: {
              value: {
                error: agencyRequestErrorMessages.INVALID_AGENCY_REQUEST_STATUS_TRANSITION,
                details: {
                  code: AgencyRequestErrorCodeSchema.enum.INVALID_AGENCY_REQUEST_STATUS_TRANSITION,
                  agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301",
                  currentStatus: "APPROVED",
                  nextStatus: "APPROVED",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
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

export const rejectAgencyRequestRoute = createRoute({
  method: "post",
  path: "/v1/admin/agency-requests/{id}/reject",
  tags: ["Admin", "Agency Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: AgencyRequestIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: RejectAgencyRequestRequestSchema,
          examples: {
            RejectWithReason: {
              value: {
                reason: "Business registration documents are incomplete.",
              },
            },
            RejectWithDescription: {
              value: {
                description: "Please provide a valid agency address and contact phone.",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Agency request rejected successfully",
      content: {
        "application/json": {
          schema: AgencyRequestDetailResponseSchema,
        },
      },
    },
    400: {
      description: "Cannot reject agency request",
      content: {
        "application/json": {
          schema: AgencyRequestErrorResponseSchema,
          examples: {
            InvalidTransition: {
              value: {
                error: agencyRequestErrorMessages.INVALID_AGENCY_REQUEST_STATUS_TRANSITION,
                details: {
                  code: AgencyRequestErrorCodeSchema.enum.INVALID_AGENCY_REQUEST_STATUS_TRANSITION,
                  agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301",
                  currentStatus: "REJECTED",
                  nextStatus: "REJECTED",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
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
export type ApproveAgencyRequestRequest = z.infer<typeof ApproveAgencyRequestRequestSchema>;
export type RejectAgencyRequestRequest = z.infer<typeof RejectAgencyRequestRequestSchema>;
