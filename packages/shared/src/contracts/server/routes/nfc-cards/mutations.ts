import { createRoute } from "@hono/zod-openapi";

import {
  forbiddenResponse,
  jsonBody,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";
import {
  AssignNfcCardBodySchema,
  CreateNfcCardBodySchema,
  NfcCardErrorCodeSchema,
  nfcCardErrorMessages,
  NfcCardErrorResponseSchema,
  NfcCardIdParamSchema,
  NfcCardSchema,
  UpdateNfcCardStatusBodySchema,
} from "./shared";

export const adminCreateNfcCardRoute = createRoute({
  method: "post",
  path: "/v1/admin/nfc-cards",
  tags: ["Admin", "NFC Cards"],
  security: [{ bearerAuth: [] }],
  description: "Create one NFC card inventory record using the firmware UID string.",
  request: jsonBody(CreateNfcCardBodySchema),
  responses: {
    201: {
      description: "NFC card created",
      content: {
        "application/json": {
          schema: NfcCardSchema,
        },
      },
    },
    400: {
      description: "Invalid request payload",
      content: {
        "application/json": {
          schema: NfcCardErrorResponseSchema,
          examples: {
            ValidationError: {
              value: {
                error: nfcCardErrorMessages.VALIDATION_ERROR,
                details: {
                  code: NfcCardErrorCodeSchema.enum.VALIDATION_ERROR,
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    409: {
      description: "UID already exists",
      content: {
        "application/json": {
          schema: NfcCardErrorResponseSchema,
          examples: {
            DuplicateUid: {
              value: {
                error: nfcCardErrorMessages.DUPLICATE_NFC_CARD_UID,
                details: {
                  code: NfcCardErrorCodeSchema.enum.DUPLICATE_NFC_CARD_UID,
                  uid: "123456789",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const adminAssignNfcCardRoute = createRoute({
  method: "patch",
  path: "/v1/admin/nfc-cards/{nfcCardId}/assign",
  tags: ["Admin", "NFC Cards"],
  security: [{ bearerAuth: [] }],
  description: "Assign an NFC card to one verified, non-banned user and activate it for tap access.",
  request: {
    params: NfcCardIdParamSchema,
    ...jsonBody(AssignNfcCardBodySchema),
  },
  responses: {
    200: {
      description: "NFC card assigned",
      content: {
        "application/json": {
          schema: NfcCardSchema,
        },
      },
    },
    400: {
      description: "User is not eligible or card state disallows assignment",
      content: {
        "application/json": {
          schema: NfcCardErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: {
      description: "Card or assignee not found",
      content: {
        "application/json": {
          schema: NfcCardErrorResponseSchema,
        },
      },
    },
    409: {
      description: "Card already assigned or user already has another card",
      content: {
        "application/json": {
          schema: NfcCardErrorResponseSchema,
        },
      },
    },
  },
});

export const adminUnassignNfcCardRoute = createRoute({
  method: "patch",
  path: "/v1/admin/nfc-cards/{nfcCardId}/unassign",
  tags: ["Admin", "NFC Cards"],
  security: [{ bearerAuth: [] }],
  description: "Return a card to inventory and remove its current assignment.",
  request: {
    params: NfcCardIdParamSchema,
  },
  responses: {
    200: {
      description: "NFC card unassigned",
      content: {
        "application/json": {
          schema: NfcCardSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "NFC card not found",
      schema: NfcCardErrorResponseSchema,
      example: {
        error: nfcCardErrorMessages.NFC_CARD_NOT_FOUND,
        details: {
          code: NfcCardErrorCodeSchema.enum.NFC_CARD_NOT_FOUND,
          nfcCardId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2212",
        },
      },
    }),
  },
});

export const adminUpdateNfcCardStatusRoute = createRoute({
  method: "patch",
  path: "/v1/admin/nfc-cards/{nfcCardId}/status",
  tags: ["Admin", "NFC Cards"],
  security: [{ bearerAuth: [] }],
  description: "Update card status for block, activate, lost, or reset to unassigned inventory.",
  request: {
    params: NfcCardIdParamSchema,
    ...jsonBody(UpdateNfcCardStatusBodySchema),
  },
  responses: {
    200: {
      description: "NFC card status updated",
      content: {
        "application/json": {
          schema: NfcCardSchema,
        },
      },
    },
    400: {
      description: "Card state transition or assignee eligibility invalid",
      content: {
        "application/json": {
          schema: NfcCardErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: {
      description: "Card or assignee not found",
      content: {
        "application/json": {
          schema: NfcCardErrorResponseSchema,
        },
      },
    },
  },
});

export const nfcCardMutations = {
  adminAssign: adminAssignNfcCardRoute,
  adminCreate: adminCreateNfcCardRoute,
  adminUnassign: adminUnassignNfcCardRoute,
  adminUpdateStatus: adminUpdateNfcCardStatusRoute,
} as const;
