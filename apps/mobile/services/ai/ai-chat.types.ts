import type { AiChatContext } from "@mebike/shared";
import type { UIMessage } from "ai";

export type AiAssistantMessageMetadata = {
  timestamp?: string;
  locale?: string;
};

export type AiAssistantMessage = UIMessage<AiAssistantMessageMetadata>;

export type AiAssistantChatContext = AiChatContext;
