import type { AiChatContext } from "@mebike/shared";
import type { UIMessage } from "ai";

import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { Context, Effect, Layer } from "effect";

import { env } from "@/config/env";
import { RentalServiceTag } from "@/domain/rentals/services/rental.service";
import { ReservationQueryServiceTag } from "@/domain/reservations";
import { WalletServiceTag } from "@/domain/wallets/services/wallet.service";
import { getOpenRouterChatModel } from "@/infrastructure/ai/openrouter";
import logger from "@/lib/logger";

import { AiConfigurationError, AiUnavailableError } from "../errors";
import { buildCustomerAssistantPrompt } from "../prompts/customer-assistant.prompt";
import { createCustomerTools, getActiveCustomerTools } from "../tools/customer-tools";

type AiChatArgs = {
  readonly chatId: string | null;
  readonly context: AiChatContext | null;
  readonly messages: UIMessage[];
  readonly userId: string;
};

export type AiChatService = {
  readonly streamCustomerAssistant: (
    args: AiChatArgs,
  ) => Effect.Effect<Response, AiConfigurationError | AiUnavailableError>;
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

      const modelMessages = yield* Effect.tryPromise({
        try: () => convertToModelMessages(args.messages),
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
        tools: createCustomerTools({
          reservationQueryService,
          rentalService,
          userId: args.userId,
          walletService,
        }),
      });

      return result.toUIMessageStreamResponse({
        originalMessages: args.messages,
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
