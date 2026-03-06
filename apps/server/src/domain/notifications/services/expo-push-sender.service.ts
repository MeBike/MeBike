import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

import { Context, Effect, Layer } from "effect";
import { Expo } from "expo-server-sdk";

import { PushProviderError } from "../domain-errors";

export type PushMessageInput = {
  readonly token: string;
  readonly title: string;
  readonly body: string;
  readonly channelId: "default" | "urgent" | "silent";
  readonly data: Record<string, string>;
};

export type PushSendOutcome
  = | { readonly token: string; readonly status: "ok" }
    | { readonly token: string; readonly status: "invalid_token"; readonly message?: string }
    | {
      readonly token: string;
      readonly status: "device_not_registered";
      readonly message?: string;
    }
    | { readonly token: string; readonly status: "error"; readonly message?: string };

export type ExpoPushSenderService = {
  readonly sendMany: (
    messages: readonly PushMessageInput[],
  ) => Effect.Effect<readonly PushSendOutcome[], PushProviderError>;
};

export class ExpoPushSenderServiceTag extends Context.Tag("ExpoPushSenderService")<
  ExpoPushSenderServiceTag,
  ExpoPushSenderService
>() {}

function mapTicketToOutcome(token: string, ticket: ExpoPushTicket): PushSendOutcome {
  if (ticket.status === "ok") {
    return { token, status: "ok" };
  }

  const detailsError = typeof ticket.details === "object" && ticket.details
    ? "error" in ticket.details && typeof ticket.details.error === "string"
      ? ticket.details.error
      : undefined
    : undefined;

  if (detailsError === "DeviceNotRegistered") {
    return {
      token,
      status: "device_not_registered",
      message: ticket.message,
    };
  }

  return {
    token,
    status: "error",
    message: ticket.message ?? detailsError,
  };
}

function buildMessage(input: PushMessageInput): ExpoPushMessage {
  return {
    to: input.token,
    title: input.title,
    body: input.body,
    channelId: input.channelId,
    sound: "default",
    data: input.data,
  };
}

export const ExpoPushSenderServiceLive = Layer.succeed(
  ExpoPushSenderServiceTag,
  {
    sendMany: messages =>
      Effect.tryPromise({
        try: async () => {
          if (messages.length === 0) {
            return [];
          }

          const expo = new Expo();
          const validMessages: ExpoPushMessage[] = [];
          const prevalidatedOutcomes: PushSendOutcome[] = [];

          for (const message of messages) {
            if (!Expo.isExpoPushToken(message.token)) {
              prevalidatedOutcomes.push({
                token: message.token,
                status: "invalid_token",
                message: "Token is not a valid Expo push token",
              });
              continue;
            }
            validMessages.push(buildMessage(message));
          }

          const outcomes = [...prevalidatedOutcomes];
          for (const chunk of expo.chunkPushNotifications(validMessages)) {
            const tickets = await expo.sendPushNotificationsAsync(chunk);
            for (let index = 0; index < tickets.length; index += 1) {
              const ticket = tickets[index];
              const chunkMessage = chunk[index];
              const to = chunkMessage?.to;
              if (!ticket || !to || Array.isArray(to)) {
                continue;
              }
              outcomes.push(mapTicketToOutcome(to, ticket));
            }
          }

          return outcomes;
        },
        catch: cause =>
          new PushProviderError({
            operation: "ExpoPushSenderService.sendMany",
            cause,
          }),
      }),
  },
);
