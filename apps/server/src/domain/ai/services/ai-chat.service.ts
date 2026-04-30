import type { AiChatContext } from "@mebike/shared";

import { convertToModelMessages, stepCountIs, streamText, validateUIMessages } from "ai";
import { Context, Effect, Layer } from "effect";

import { env } from "@/config/env";
import { BikeServiceTag } from "@/domain/bikes";
import { RentalCommandServiceTag } from "@/domain/rentals";
import { RentalServiceTag } from "@/domain/rentals/services/queries/rental.service";
import { ReservationQueryServiceTag } from "@/domain/reservations";
import { StationQueryServiceTag } from "@/domain/stations";
import { WalletQueryServiceTag } from "@/domain/wallets/services/queries/wallet-query.service";
import { getOpenRouterChatModel } from "@/infrastructure/ai/openrouter";

import type { CustomerAssistantUIMessage } from "../messages/customer-assistant-ui";

import {
  AiConfigurationError,
  AiInvalidRequestError,
  AiUnavailableError,
} from "../errors";
import {
  convertCustomerAssistantDataPart,
  customerAssistantDataSchemas,
  CustomerAssistantMessageMetadataSchema,
} from "../messages/customer-assistant-ui";
import { buildCustomerAssistantPrompt } from "../prompts/customer-assistant.prompt";
import { createCustomerTools, getActiveCustomerTools } from "../tools/customer-tools";
import {
  createAiStreamLoggingHooks,
  elapsedMsSince,
  summarizeLatestUserMessage,
} from "./ai-chat.logging";

type AiChatArgs = {
  readonly chatId: string | null;
  readonly context: AiChatContext | null;
  readonly messages: unknown;
  readonly userId: string;
};

export type AiChatService = {
  readonly streamCustomerAssistant: (
    args: AiChatArgs,
  ) => Effect.Effect<
    Response,
    AiConfigurationError | AiInvalidRequestError | AiUnavailableError
  >;
};

const makeAiChatService = Effect.gen(function* () {
  const bikeService = yield* BikeServiceTag;
  const rentalCommandService = yield* RentalCommandServiceTag;
  const rentalService = yield* RentalServiceTag;
  const reservationQueryService = yield* ReservationQueryServiceTag;
  const stationQueryService = yield* StationQueryServiceTag;
  const walletService = yield* WalletQueryServiceTag;

  const streamCustomerAssistant: AiChatService["streamCustomerAssistant"] = args =>
    Effect.gen(function* () {
      const requestStartedAt = performance.now();

      if (!env.OPENROUTER_API_KEY) {
        return yield* Effect.fail(new AiConfigurationError({
          message: "OPENROUTER_API_KEY is required for AI chat.",
        }));
      }

      const tools = createCustomerTools({
        bikeService,
        context: args.context,
        rentalCommandService,
        reservationQueryService,
        rentalService,
        stationQueryService,
        userId: args.userId,
        walletService,
      });

      const validationStartedAt = performance.now();

      const validatedMessages = yield* Effect.tryPromise({
        try: () => validateUIMessages<CustomerAssistantUIMessage>({
          messages: args.messages,
          metadataSchema: CustomerAssistantMessageMetadataSchema,
          dataSchemas: customerAssistantDataSchemas,
          tools,
        }),
        catch: error =>
          new AiInvalidRequestError({
            message: error instanceof Error ? error.message : "Invalid AI chat message payload",
          }),
      });

      const validationDurationMs = elapsedMsSince(validationStartedAt);
      const messageConversionStartedAt = performance.now();

      const modelMessages = yield* Effect.tryPromise({
        try: () => convertToModelMessages(validatedMessages, {
          tools,
          convertDataPart: convertCustomerAssistantDataPart,
        }),
        catch: cause =>
          new AiUnavailableError({
            message: "Failed to prepare AI request messages.",
            cause,
          }),
      });

      const messageConversionDurationMs = elapsedMsSince(messageConversionStartedAt);
      const requestPreparationDurationMs = elapsedMsSince(requestStartedAt);

      const activeTools = getActiveCustomerTools(args.context?.screen);
      const streamLogging = createAiStreamLoggingHooks({
        activeToolCount: activeTools.length,
        chatId: args.chatId,
        latestUserMessagePreview: summarizeLatestUserMessage(validatedMessages),
        messageCount: validatedMessages.length,
        messageConversionDurationMs,
        model: env.AI_MODEL,
        modelMessageCount: modelMessages.length,
        requestPreparationDurationMs,
        reasoningEffort: env.OPENROUTER_REASONING_EFFORT,
        validationDurationMs,
      });

      const result = streamText({
        model: getOpenRouterChatModel(),
        temperature: 0,
        maxOutputTokens: 2400,
        providerOptions: {
          openrouter: {
            reasoning: {
              effort: env.OPENROUTER_REASONING_EFFORT,
            },
          },
        },
        stopWhen: stepCountIs(12),
        system: buildCustomerAssistantPrompt(args.context),
        messages: modelMessages,
        activeTools,
        tools,
        onChunk: event => streamLogging.onChunk(event),
        experimental_onStart: () => streamLogging.onStart(),
        experimental_onStepStart: event => streamLogging.onStepStart(event),
        experimental_onToolCallStart: event => streamLogging.onToolCallStart(event),
        experimental_onToolCallFinish: event => streamLogging.onToolCallFinish(event),
        onStepFinish: event => streamLogging.onStepFinish(event),
        onAbort: () => streamLogging.onAbort(),
        onFinish: event => streamLogging.onFinish(event),
      });

      return result.toUIMessageStreamResponse({
        originalMessages: validatedMessages,
        onError: streamLogging.onResponseError,
      });
    });

  return {
    streamCustomerAssistant,
  } satisfies AiChatService;
});

export class AiChatServiceTag extends Context.Tag("AiChatService")<
  AiChatServiceTag,
  AiChatService
>() {}

export const AiChatServiceLive = Layer.effect(
  AiChatServiceTag,
  makeAiChatService,
);
