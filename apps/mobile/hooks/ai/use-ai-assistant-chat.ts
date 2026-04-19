import type { AiAssistantChatContext, AiAssistantMessage } from "@services/ai";
import type { ChatRequestOptions, ChatStatus } from "ai";

import { useChat } from "@ai-sdk/react";
import { createAiAssistantChatTransport } from "@services/ai";
import { useCallback, useEffect, useMemo, useRef } from "react";

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
  const contextRef = useRef(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const transport = useMemo(() => {
    return createAiAssistantChatTransport({
      getContext: () => contextRef.current,
    });
  }, []);

  const {
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

  return {
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
