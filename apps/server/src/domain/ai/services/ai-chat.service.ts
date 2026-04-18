import type { AiChatContext } from "@mebike/shared";

import { convertToModelMessages, stepCountIs, streamText, validateUIMessages } from "ai";
import { Context, Effect, Layer } from "effect";

import { env } from "@/config/env";
import { RentalServiceTag } from "@/domain/rentals/services/rental.service";
import { ReservationQueryServiceTag } from "@/domain/reservations";
import { WalletServiceTag } from "@/domain/wallets/services/wallet.service";
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

export type AiChatService = {
  readonly streamCustomerAssistant: (
    args: AiChatArgs,
  ) => Effect.Effect<
    Response,
    AiConfigurationError | AiInvalidRequestError | AiUnavailableError
  >;
};

const makeAiChatService = Effect.gen(function* () {
  const rentalService = yield* RentalServiceTag;
  const reservationQueryService = yield* ReservationQueryServiceTag;
  const walletService = yield* WalletServiceTag;

  const streamCustomerAssistant: AiChatService["streamCustomerAssistant"] = args =>
    Effect.gen(function* () {
      if (!env.OPENROUTER_API_KEY) {
        return yield* Effect.fail(new AiConfigurationError({
          message: "OPENROUTER_API_KEY is required for AI chat.",
        }));
      }

      const tools = createCustomerTools({
        context: args.context,
        reservationQueryService,
        rentalService,
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
