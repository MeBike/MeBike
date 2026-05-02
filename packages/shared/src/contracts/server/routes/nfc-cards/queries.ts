import { createRoute } from "@hono/zod-openapi";

import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";
import {
  ListNfcCardsQuerySchema,
  NfcCardErrorCodeSchema,
  nfcCardErrorMessages,
  NfcCardErrorResponseSchema,
  NfcCardIdParamSchema,
  NfcCardListResponseSchema,
  NfcCardSchema,
} from "./shared";

export const adminListNfcCardsRoute = createRoute({
  method: "get",
  path: "/v1/admin/nfc-cards",
  tags: ["Admin", "NFC Cards"],
  security: [{ bearerAuth: [] }],
  description: "List NFC cards, optionally filtered by status, current assignee, or UID substring.",
  request: {
    query: ListNfcCardsQuerySchema,
  },
  responses: {
    200: {
      description: "Admin list of NFC cards",
      content: {
        "application/json": {
          schema: NfcCardListResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminGetNfcCardRoute = createRoute({
  method: "get",
  path: "/v1/admin/nfc-cards/{nfcCardId}",
  tags: ["Admin", "NFC Cards"],
  security: [{ bearerAuth: [] }],
  description: "Get one NFC card with current assignment summary.",
  request: {
    params: NfcCardIdParamSchema,
  },
  responses: {
    200: {
      description: "NFC card detail",
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

export const nfcCardQueries = {
  adminGet: adminGetNfcCardRoute,
  adminList: adminListNfcCardsRoute,
} as const;
