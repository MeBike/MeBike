import { createRoute } from "@hono/zod-openapi";

import {
  AiChatRequestSchema,
  AiChatStreamResponseSchema,
  AiErrorCodeSchema,
  aiErrorMessages,
  AiErrorResponseSchema,
} from "../../ai/schemas";
import { unauthorizedResponse } from "../helpers";

export const chatRoute = createRoute({
  method: "post",
  path: "/v1/ai/chat",
  tags: ["AI"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AiChatRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "AI UI message stream",
      content: {
        "text/event-stream": {
          schema: AiChatStreamResponseSchema,
          examples: {
            Stream: {
              value: "data: {\"type\":\"text-delta\",\"delta\":\"Hello\"}\n\n",
            },
          },
        },
      },
    },
    400: {
      description: "Messages are not valid AI chat UI messages",
      content: {
        "application/json": {
          schema: AiErrorResponseSchema,
          examples: {
            InvalidRequest: {
              value: {
                error: aiErrorMessages.AI_INVALID_REQUEST,
                details: { code: AiErrorCodeSchema.enum.AI_INVALID_REQUEST },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    503: {
      description: "AI service unavailable",
      content: {
        "application/json": {
          schema: AiErrorResponseSchema,
          examples: {
            NotConfigured: {
              value: {
                error: aiErrorMessages.AI_NOT_CONFIGURED,
                details: { code: AiErrorCodeSchema.enum.AI_NOT_CONFIGURED },
              },
            },
            Unavailable: {
              value: {
                error: aiErrorMessages.AI_UNAVAILABLE,
                details: { code: AiErrorCodeSchema.enum.AI_UNAVAILABLE },
              },
            },
          },
        },
      },
    },
  },
});
