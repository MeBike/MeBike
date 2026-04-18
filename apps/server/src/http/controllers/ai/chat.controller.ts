import type { RouteHandler } from "@hono/zod-openapi";

import { validateUIMessages } from "ai";
import { Effect, Match } from "effect";

import { AiChatServiceTag, AiInvalidRequestError } from "@/domain/ai";
import { withLoggedCause } from "@/domain/shared";

import type { AiErrorResponse, AiRoutes } from "./shared";

import { AiErrorCodeSchema, aiErrorMessages, unauthorizedBody } from "./shared";

export const chat: RouteHandler<AiRoutes["chat"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.tryPromise({
      try: () => validateUIMessages({ messages: body.messages }),
      catch: error =>
        new AiInvalidRequestError({
          message: error instanceof Error ? error.message : "Invalid AI chat message payload",
        }),
    }).pipe(
      Effect.flatMap(messages =>
        Effect.flatMap(AiChatServiceTag, service => service.streamCustomerAssistant({
          userId,
          chatId: body.id ?? null,
          context: body.context ?? null,
          messages,
        }))),
    ),
    "POST /v1/ai/chat",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => right),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("AiInvalidRequestError", ({ message }) =>
          c.json<AiErrorResponse, 400>({
            error: aiErrorMessages.AI_INVALID_REQUEST,
            details: {
              code: AiErrorCodeSchema.enum.AI_INVALID_REQUEST,
              reason: message,
            },
          }, 400)),
        Match.tag("AiConfigurationError", () =>
          c.json<AiErrorResponse, 503>({
            error: aiErrorMessages.AI_NOT_CONFIGURED,
            details: { code: AiErrorCodeSchema.enum.AI_NOT_CONFIGURED },
          }, 503)),
        Match.tag("AiUnavailableError", () =>
          c.json<AiErrorResponse, 503>({
            error: aiErrorMessages.AI_UNAVAILABLE,
            details: { code: AiErrorCodeSchema.enum.AI_UNAVAILABLE },
          }, 503)),
        Match.orElse(() =>
          c.json<AiErrorResponse, 500>({
            error: aiErrorMessages.AI_UNAVAILABLE,
            details: { code: AiErrorCodeSchema.enum.AI_UNAVAILABLE },
          }, 500)),
      )),
    Match.exhaustive,
  );
};
