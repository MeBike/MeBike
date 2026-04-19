import type { ChatRequestOptions, ChatStatus } from "ai";

import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { AiAssistantChatContext, AiAssistantMessage } from "@services/ai";

import { useCurrentLocation } from "@providers/location-provider";
import { createAiAssistantChatTransport } from "@services/ai";

export type UseAiAssistantChatOptions = {
  chatId?: string;
  context?: AiAssistantChatContext | null;
  initialMessages?: AiAssistantMessage[];
  onError?: (error: Error) => void;
};

function createChatId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAiAssistantChat({
  chatId,
  context,
  initialMessages,
  onError,
}: UseAiAssistantChatOptions = {}) {
  const stableChatId = useRef(chatId ?? createChatId());
  const { location, status: locationStatus } = useCurrentLocation();
  const mergedContext = useMemo(() => {
    if (locationStatus !== "ready" || !location) {
      return context ?? null;
    }

    return {
      ...(context ?? {}),
      location,
    };
  }, [context, location, locationStatus]);
  const contextRef = useRef(mergedContext);

  useEffect(() => {
    contextRef.current = mergedContext;
  }, [mergedContext]);

  const transport = useMemo(() => {
    return createAiAssistantChatTransport({
      getContext: () => contextRef.current,
    });
  }, []);

  const {
    addToolApprovalResponse,
    error,
    id,
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat<AiAssistantMessage>({
    id: stableChatId.current,
    messages: initialMessages ?? [],
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    transport,
    onError,
  });

  const sendTextMessage = useCallback(async (text: string, options?: ChatRequestOptions) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    await sendMessage({
      text: trimmedText,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    }, options);
  }, [sendMessage]);

  const stopStreaming = useCallback(() => {
    void stop();
  }, [stop]);

  const respondToToolApproval = useCallback((id: string, approved: boolean) => {
    addToolApprovalResponse({
      approved,
      id,
    });
  }, [addToolApprovalResponse]);

  return {
    addToolApprovalResponse: respondToToolApproval,
    error,
    id,
    isBusy: status === "submitted" || status === "streaming",
    messages,
    sendTextMessage,
    setMessages,
    status: status as ChatStatus,
    stop: stopStreaming,
  };
}
