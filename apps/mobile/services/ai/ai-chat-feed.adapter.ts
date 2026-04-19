import { isToolUIPart } from "ai";

import type { AiAssistantMessage } from "./ai-chat.types";

export type AiAssistantFeedUser = {
  id: string;
  name: string;
};

export type AiAssistantToolActivityState = "running" | "done" | "error";

export type AiAssistantToolActivity = {
  key: string;
  toolCallId: string;
  toolName: string;
  label: string;
  rawState:
    | "approval-requested"
    | "approval-responded"
    | "input-available"
    | "input-streaming"
    | "output-available"
    | "output-denied"
    | "output-error";
  state: AiAssistantToolActivityState;
  errorText?: string;
};

export type AiAssistantFeedMessage = {
  id: string;
  createdAt: Date;
  role: "user" | "assistant";
  text: string;
  markdown: string;
  hasTextContent: boolean;
  isStreaming: boolean;
  toolActivities: AiAssistantToolActivity[];
  visibleToolActivity: AiAssistantToolActivity | null;
  rawMessage: AiAssistantMessage;
  user: AiAssistantFeedUser;
};

export const AI_ASSISTANT_FEED_USER: AiAssistantFeedUser = {
  id: "mebike-ai-assistant",
  name: "MeBike AI",
};

export const AI_ASSISTANT_CURRENT_USER: AiAssistantFeedUser = {
  id: "mebike-current-user",
  name: "You",
};

type MapAiAssistantMessagesToFeedOptions = {
  assistantUser?: AiAssistantFeedUser;
  currentUser?: AiAssistantFeedUser;
};

type ToolActivityCopy = {
  done: string;
  error: string;
  running: string;
};

type ToolPart = Extract<
  AiAssistantMessage["parts"][number],
  { type: `tool-${string}` } | { type: "dynamic-tool" }
>;

type ToolPartState = AiAssistantToolActivity["rawState"];

const TOOL_ACTIVITY_COPY: Record<string, ToolActivityCopy> = {
  getCurrentRentalSummary: {
    done: "Đã kiểm tra chuyến thuê hiện tại",
    error: "Không thể kiểm tra chuyến thuê hiện tại",
    running: "Đang kiểm tra chuyến thuê hiện tại",
  },
  getRentalDetail: {
    done: "Đã lấy chi tiết chuyến thuê",
    error: "Không thể tải chi tiết chuyến thuê",
    running: "Đang lấy chi tiết chuyến thuê",
  },
  getReservationDetail: {
    done: "Đã lấy chi tiết đặt chỗ",
    error: "Không thể tải chi tiết đặt chỗ",
    running: "Đang lấy chi tiết đặt chỗ",
  },
  getReservationSummary: {
    done: "Đã kiểm tra đặt chỗ",
    error: "Không thể kiểm tra đặt chỗ",
    running: "Đang kiểm tra đặt chỗ",
  },
  getWalletSummary: {
    done: "Đã kiểm tra ví",
    error: "Không thể kiểm tra ví",
    running: "Đang kiểm tra ví",
  },
  getWalletTransactionDetail: {
    done: "Đã lấy chi tiết giao dịch ví",
    error: "Không thể tải chi tiết giao dịch ví",
    running: "Đang lấy chi tiết giao dịch ví",
  },
};

function isToolPart(part: AiAssistantMessage["parts"][number]): part is ToolPart {
  return isToolUIPart(part);
}

function getToolName(part: ToolPart) {
  return part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);
}

function getToolActivityState(rawState: ToolPartState): AiAssistantToolActivityState {
  switch (rawState) {
    case "output-available":
      return "done";
    case "output-denied":
    case "output-error":
      return "error";
    default:
      return "running";
  }
}

function getToolActivityLabel(toolName: string, state: AiAssistantToolActivityState) {
  const copy = TOOL_ACTIVITY_COPY[toolName];

  if (copy) {
    return copy[state];
  }

    switch (state) {
      case "done":
      return "Đã lấy xong thông tin";
      case "error":
      return "Không thể tải thông tin";
      default:
      return "Đang lấy thông tin";
  }
}

export function getAiAssistantToolActivities(
  message: AiAssistantMessage,
): AiAssistantToolActivity[] {
  return message.parts
    .filter(isToolPart)
    .map(part => {
      const toolName = getToolName(part);
      const state = getToolActivityState(part.state);

      return {
        errorText: part.errorText,
        key: `${part.toolCallId}:${part.state}`,
        label: part.title ?? getToolActivityLabel(toolName, state),
        rawState: part.state,
        state,
        toolCallId: part.toolCallId,
        toolName,
      } satisfies AiAssistantToolActivity;
    });
}

export function getVisibleAiAssistantToolActivity(
  message: AiAssistantMessage,
): AiAssistantToolActivity | null {
  const activities = getAiAssistantToolActivities(message);

  return activities.find(activity => activity.state === "running")
    ?? activities.find(activity => activity.state === "error")
    ?? null;
}

function getMessageCreatedAt(message: AiAssistantMessage) {
  const timestamp = message.metadata?.timestamp;

  if (timestamp) {
    const parsedDate = new Date(timestamp);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return new Date();
}

export function getAiAssistantMessageMarkdown(message: AiAssistantMessage) {
  return message.parts
    .filter(part => part.type === "text")
    .map(part => part.text)
    .join("")
    .trim();
}

export function isAiAssistantMessageStreaming(message: AiAssistantMessage) {
  return message.parts.some(part => part.type === "text" && part.state === "streaming");
}

export function mapAiAssistantMessagesToFeed(
  messages: AiAssistantMessage[],
  options: MapAiAssistantMessagesToFeedOptions = {},
): AiAssistantFeedMessage[] {
  const {
    assistantUser = AI_ASSISTANT_FEED_USER,
    currentUser = AI_ASSISTANT_CURRENT_USER,
  } = options;

  return messages
    .filter((message): message is AiAssistantMessage & { role: "assistant" | "user" } => {
      return message.role === "assistant" || message.role === "user";
    })
    .map(message => {
      const markdown = getAiAssistantMessageMarkdown(message);
      const isStreaming = isAiAssistantMessageStreaming(message);
      const toolActivities = getAiAssistantToolActivities(message);

      return {
        createdAt: getMessageCreatedAt(message),
        hasTextContent: markdown.length > 0,
        id: message.id,
        isStreaming,
        markdown,
        rawMessage: message,
        role: message.role,
        text: markdown,
        toolActivities,
        user: message.role === "assistant" ? assistantUser : currentUser,
        visibleToolActivity: getVisibleAiAssistantToolActivity(message),
      } satisfies AiAssistantFeedMessage;
    });
}
