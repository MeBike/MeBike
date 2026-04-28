import type { AiChatContext } from "@mebike/shared";
import type { OpenRouterUsageAccounting } from "@openrouter/ai-sdk-provider";

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
import logger from "@/lib/logger";

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

type AiChatArgs = {
  readonly chatId: string | null;
  readonly context: AiChatContext | null;
  readonly messages: unknown;
  readonly userId: string;
};

function getOpenRouterUsageAccounting(providerMetadata: unknown): OpenRouterUsageAccounting | null {
  if (!providerMetadata || typeof providerMetadata !== "object") {
    return null;
  }

  const openrouter = (providerMetadata as { openrouter?: { usage?: OpenRouterUsageAccounting } }).openrouter;
  return openrouter?.usage ?? null;
}

function formatAiUsageMetrics(usage: OpenRouterUsageAccounting | null) {
  if (!usage) {
    return null;
  }

  const promptTokens = usage.promptTokens;
  const completionTokens = usage.completionTokens;
  const totalTokens = usage.totalTokens;
  const cachedTokens = usage.promptTokensDetails?.cachedTokens ?? 0;
  const upstreamCost = usage.costDetails?.upstreamInferenceCost;
  const billedCost = usage.cost;
  const cacheHitRate = promptTokens > 0 ? cachedTokens / promptTokens : 0;
  const savings = upstreamCost !== undefined && billedCost !== undefined
    ? upstreamCost - billedCost
    : undefined;
  const savingsRate = upstreamCost && upstreamCost > 0 && savings !== undefined
    ? savings / upstreamCost
    : undefined;

  return {
    billedCost,
    cacheHitRate,
    cachedTokens,
    completionTokens,
    promptTokens,
    savings,
    savingsRate,
    totalTokens,
    upstreamCost,
  };
}

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

      const result = streamText({
        model: getOpenRouterChatModel(),
        temperature: 0,
        maxOutputTokens: 700,
        stopWhen: stepCountIs(5),
        system: buildCustomerAssistantPrompt(args.context),
        messages: modelMessages,
        activeTools: getActiveCustomerTools(args.context?.screen),
        tools,
        onAbort: () => {
          logger.info({
            chatId: args.chatId,
            context: args.context,
            model: env.AI_MODEL,
            providerOnly: env.OPENROUTER_PROVIDER_ONLY,
            quantizations: env.OPENROUTER_PROVIDER_QUANTIZATIONS,
            userId: args.userId,
          }, "AI stream aborted");
        },
        onFinish: (event) => {
          const usage = getOpenRouterUsageAccounting(event.providerMetadata);

          logger.info({
            chatId: args.chatId,
            context: args.context,
            finishReason: event.finishReason,
            model: env.AI_MODEL,
            providerOnly: env.OPENROUTER_PROVIDER_ONLY,
            quantizations: env.OPENROUTER_PROVIDER_QUANTIZATIONS,
            rawFinishReason: event.rawFinishReason,
            responseId: event.response.id,
            steps: event.steps.length,
            usage: formatAiUsageMetrics(usage),
            userId: args.userId,
            warnings: event.warnings,
          }, "AI stream finished");
        },
      });

      return result.toUIMessageStreamResponse({
        originalMessages: validatedMessages,
        onError: (error) => {
          logger.error({ error }, "AI stream failed");
          return "Assistant unavailable right now. Please try again.";
        },
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
