import type { AiChatRequest } from "@mebike/shared";

import { API_BASE_URL } from "@lib/api-base-url";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { DefaultChatTransport } from "ai";

import type { AiAssistantChatContext, AiAssistantMessage } from "./ai-chat.types";

import { aiChatFetch } from "./ai-chat-fetch";

type AiAssistantChatRequestOverrides = Partial<Pick<AiChatRequest, "context" | "id">>
  & Record<string, unknown>;

type AiAssistantChatRequestBody = Omit<AiChatRequest, "messages"> & {
  messages: AiAssistantMessage[];
} & Record<string, unknown>;

export type CreateAiAssistantChatTransportOptions = {
  context?: AiAssistantChatContext | null;
  getContext?: () => AiAssistantChatContext | null | undefined;
  api?: string;
};

export function getAiAssistantChatApiUrl() {
  return `${API_BASE_URL}/${routePath(ServerRoutes.ai.chat)}`;
}

function isMeaningfulTextPart(part: AiAssistantMessage["parts"][number]) {
  return part.type === "text" && part.text.trim().length > 0;
}

function isNonTextContentPart(part: AiAssistantMessage["parts"][number]) {
  return part.type !== "text";
}

function hasAssistantContent(message: AiAssistantMessage) {
  return message.parts.some(part => isMeaningfulTextPart(part) || isNonTextContentPart(part));
}

function normalizeAiAssistantMessages(messages: AiAssistantMessage[]): AiAssistantMessage[] {
  return messages
    .filter(message => message.role !== "assistant" || hasAssistantContent(message))
    .map(message => ({
      ...message,
      metadata: message.metadata ?? {},
    }));
}

function buildAiAssistantRequestBody({
  chatId,
  context,
  messages,
  requestBody,
}: {
  chatId: string;
  context: AiAssistantChatContext | null | undefined;
  messages: AiAssistantMessage[];
  requestBody: AiAssistantChatRequestOverrides | undefined;
}): AiAssistantChatRequestBody {
  return {
    ...requestBody,
    id: requestBody?.id ?? chatId,
    context: requestBody?.context ?? context ?? null,
    messages: normalizeAiAssistantMessages(messages),
  };
}

export function createAiAssistantChatTransport(
  options: CreateAiAssistantChatTransportOptions = {},
) {
  const { context, getContext, api = getAiAssistantChatApiUrl() } = options;

  return new DefaultChatTransport<AiAssistantMessage>({
    api,
    fetch: aiChatFetch,
    prepareSendMessagesRequest: ({
      api: requestApi,
      body,
      credentials,
      headers,
      id,
      messages,
    }) => ({
      api: requestApi,
      headers,
      credentials,
      body: buildAiAssistantRequestBody({
        chatId: id,
        context: getContext?.() ?? context,
        messages,
        requestBody: body as AiAssistantChatRequestOverrides | undefined,
      }),
    }),
  });
}
