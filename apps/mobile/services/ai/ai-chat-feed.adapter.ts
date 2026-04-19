import { isToolUIPart } from "ai";

import type { AiAssistantMessage } from "./ai-chat.types";

export type AiAssistantFeedUser = {
  id: string;
  name: string;
};

export type AiAssistantToolActivityState = "running" | "done" | "error";

export type AiAssistantToolActivity = {
  approvalId?: string;
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
  actionCards: AiAssistantActionCard[];
  contentBlocks: AiAssistantContentBlock[];
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

export type AiAssistantActionCardState = "approval" | "success" | "failure" | "denied";

export type AiAssistantActionCardSummaryItem = {
  label: string;
  value: string;
};

export type AiAssistantActionCard = {
  approvalId?: string;
  description?: string;
  key: string;
  state: AiAssistantActionCardState;
  suggestedAction?: string;
  summaryItems: AiAssistantActionCardSummaryItem[];
  title: string;
  toolCallId: string;
  toolName: string;
};

export type AiAssistantContentBlock
  = | {
    kind: "text";
    key: string;
    markdown: string;
  }
  | {
    activity: AiAssistantToolActivity;
    key: string;
    kind: "tool-activity";
  }
  | {
    card: AiAssistantActionCard;
    key: string;
    kind: "action-card";
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
  approvalRequested?: string;
  done: string;
  denied?: string;
  error: string;
  running: string;
};

type ToolPart = Extract<
  AiAssistantMessage["parts"][number],
  { type: `tool-${string}` } | { type: "dynamic-tool" }
>;

type ToolPartState = AiAssistantToolActivity["rawState"];

type StructuredToolFailureOutput = {
  ok: false;
  error: {
    suggestedAction?: string;
    userMessage: string;
  };
};

type StructuredReturnSlotSuccessOutput = {
  ok: true;
  rentalId: string;
  returnSlot: {
    reservedFromDisplay?: string | null;
    station?: {
      address?: string;
      name?: string;
    } | null;
    statusLabel?: string;
  };
};

type ToolInputRecord = Record<string, unknown>;

const ACTION_TOOL_NAMES = new Set([
  "createReturnSlot",
  "switchReturnSlot",
  "cancelReturnSlot",
]);

const TOOL_ACTIVITY_COPY: Record<string, ToolActivityCopy> = {
  getCurrentRentalSummary: {
    done: "Đã kiểm tra chuyến thuê hiện tại",
    error: "Không thể kiểm tra chuyến thuê hiện tại",
    running: "Đang kiểm tra chuyến thuê hiện tại",
  },
  getCurrentReturnSlot: {
    done: "Đã kiểm tra giữ chỗ trả xe hiện tại",
    error: "Không thể kiểm tra giữ chỗ trả xe hiện tại",
    running: "Đang kiểm tra giữ chỗ trả xe hiện tại",
  },
  createReturnSlot: {
    approvalRequested: "Chờ bạn xác nhận giữ chỗ trả xe",
    denied: "Bạn đã từ chối giữ chỗ trả xe",
    done: "Đã giữ chỗ trả xe",
    error: "Không thể giữ chỗ trả xe",
    running: "Đang chuẩn bị giữ chỗ trả xe",
  },
  switchReturnSlot: {
    approvalRequested: "Chờ bạn xác nhận đổi trạm giữ chỗ trả xe",
    denied: "Bạn đã từ chối đổi trạm giữ chỗ trả xe",
    done: "Đã đổi trạm giữ chỗ trả xe",
    error: "Không thể đổi trạm giữ chỗ trả xe",
    running: "Đang chuẩn bị đổi trạm giữ chỗ trả xe",
  },
  cancelReturnSlot: {
    approvalRequested: "Chờ bạn xác nhận hủy giữ chỗ trả xe",
    denied: "Bạn đã từ chối hủy giữ chỗ trả xe",
    done: "Đã hủy giữ chỗ trả xe",
    error: "Không thể hủy giữ chỗ trả xe",
    running: "Đang chuẩn bị hủy giữ chỗ trả xe",
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
  getStationDetail: {
    done: "Đã lấy thông tin trạm",
    error: "Không thể tải thông tin trạm",
    running: "Đang lấy thông tin trạm",
  },
  searchStations: {
    done: "Đã tìm trạm phù hợp",
    error: "Không thể tìm trạm phù hợp",
    running: "Đang tìm trạm phù hợp",
  },
  getNearbyStations: {
    done: "Đã tìm các trạm lân cận",
    error: "Không thể tìm các trạm lân cận",
    running: "Đang tìm các trạm lân cận",
  },
  getNearbyStationsFromLocation: {
    done: "Đã tìm các trạm gần vị trí hiện tại",
    error: "Không thể tìm các trạm gần vị trí hiện tại",
    running: "Đang tìm các trạm gần vị trí hiện tại",
  },
  getStationAvailableBikes: {
    done: "Đã kiểm tra xe có sẵn tại trạm",
    error: "Không thể kiểm tra xe có sẵn tại trạm",
    running: "Đang kiểm tra xe có sẵn tại trạm",
  },
  getBikeDetail: {
    done: "Đã lấy thông tin xe",
    error: "Không thể tải thông tin xe",
    running: "Đang lấy thông tin xe",
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

function isActionToolName(toolName: string) {
  return ACTION_TOOL_NAMES.has(toolName);
}

function getToolInputRecord(part: ToolPart): ToolInputRecord | null {
  if (!("input" in part) || !part.input || typeof part.input !== "object" || Array.isArray(part.input)) {
    return null;
  }

  return part.input as ToolInputRecord;
}

function isStructuredReturnSlotSuccessOutput(output: unknown): output is StructuredReturnSlotSuccessOutput {
  if (!output || typeof output !== "object") {
    return false;
  }

  const candidate = output as Record<string, unknown>;

  return candidate.ok === true
    && typeof candidate.rentalId === "string"
    && !!candidate.returnSlot
    && typeof candidate.returnSlot === "object";
}

function getStructuredReturnSlotSuccessOutput(part: ToolPart): StructuredReturnSlotSuccessOutput | null {
  if (part.state !== "output-available" || !("output" in part)) {
    return null;
  }

  return isStructuredReturnSlotSuccessOutput(part.output) ? part.output : null;
}

function getActionToolTitle(toolName: string) {
  switch (toolName) {
    case "createReturnSlot":
      return "Giữ chỗ trả xe";
    case "switchReturnSlot":
      return "Đổi trạm giữ chỗ trả xe";
    case "cancelReturnSlot":
      return "Hủy giữ chỗ trả xe";
    default:
      return "Xác nhận thao tác";
  }
}

function getActionToolApprovalDescription(toolName: string) {
  switch (toolName) {
    case "createReturnSlot":
      return "Vui lòng kiểm tra và xác nhận thao tác giữ chỗ trả xe.";
    case "switchReturnSlot":
      return "Vui lòng kiểm tra và xác nhận thao tác đổi trạm giữ chỗ trả xe.";
    case "cancelReturnSlot":
      return "Vui lòng kiểm tra và xác nhận thao tác hủy giữ chỗ trả xe.";
    default:
      return undefined;
  }
}

function getStationSummaryValue(input: ToolInputRecord) {
  if (typeof input.stationReference === "string" && input.stationReference === "context") {
    return "Theo trạm đang mở";
  }

  if (typeof input.stationId === "string" && input.stationId.trim().length > 0) {
    return `Mã trạm ${input.stationId}`;
  }

  return null;
}

function getRentalSummaryValue(input: ToolInputRecord) {
  if (typeof input.rentalReference === "string") {
    switch (input.rentalReference) {
      case "current":
        return "Chuyến thuê hiện tại";
      case "latest":
        return "Chuyến thuê gần nhất";
      case "context":
        return "Theo chuyến thuê đang mở";
      default:
        break;
    }
  }

  if (typeof input.rentalId === "string" && input.rentalId.trim().length > 0) {
    return `Mã chuyến ${input.rentalId}`;
  }

  return null;
}

function getSuggestedActionText(suggestedAction?: string) {
  switch (suggestedAction) {
    case "check_current_rental":
      return "Kiểm tra lại chuyến thuê hiện tại";
    case "check_current_return_slot":
      return "Kiểm tra lại giữ chỗ trả xe hiện tại";
    case "choose_station_again":
      return "Chọn lại trạm";
    case "search_stations":
      return "Tìm trạm phù hợp khác";
    case "choose_another_station":
      return "Chọn trạm khác còn chỗ trả";
    case "retry_later":
      return "Thử lại sau ít phút";
    default:
      return null;
  }
}

function getActionCardSummaryItems(
  toolName: string,
  part: ToolPart,
  failure: StructuredToolFailureOutput | null,
  success: StructuredReturnSlotSuccessOutput | null,
): AiAssistantActionCardSummaryItem[] {
  if (success) {
    const items: AiAssistantActionCardSummaryItem[] = [];
    const stationName = success.returnSlot.station?.name;
    const stationAddress = success.returnSlot.station?.address;
    const reservedFromDisplay = success.returnSlot.reservedFromDisplay;
    const statusLabel = success.returnSlot.statusLabel;

    if (stationName) {
      items.push({ label: toolName === "cancelReturnSlot" ? "Trạm đã hủy" : "Trạm", value: stationName });
    }

    if (stationAddress) {
      items.push({ label: "Địa điểm", value: stationAddress });
    }

    if (statusLabel) {
      items.push({ label: "Trạng thái", value: statusLabel });
    }

    if (reservedFromDisplay && toolName !== "cancelReturnSlot") {
      items.push({ label: "Bắt đầu giữ chỗ từ", value: reservedFromDisplay });
    }

    return items;
  }

  if (failure) {
    const suggestedActionText = getSuggestedActionText(failure.error.suggestedAction);

    return suggestedActionText
      ? [{ label: "Gợi ý", value: suggestedActionText }]
      : [];
  }

  const input = getToolInputRecord(part);

  if (!input) {
    return [];
  }

  const items: AiAssistantActionCardSummaryItem[] = [];
  const stationValue = getStationSummaryValue(input);
  const rentalValue = getRentalSummaryValue(input);

  items.push({ label: "Thao tác", value: getActionToolTitle(toolName) });

  if (stationValue) {
    items.push({ label: "Trạm", value: stationValue });
  }

  if (rentalValue) {
    items.push({ label: "Áp dụng cho", value: rentalValue });
  }

  return items;
}

function getActionCardState(part: ToolPart, failure: StructuredToolFailureOutput | null, success: StructuredReturnSlotSuccessOutput | null): AiAssistantActionCardState | null {
  if (part.state === "approval-requested") {
    return "approval";
  }

  if (part.state === "output-denied") {
    return "denied";
  }

  if (failure || part.state === "output-error") {
    return "failure";
  }

  if (success) {
    return "success";
  }

  return null;
}

function getActionCardDescription(
  state: AiAssistantActionCardState,
  toolName: string,
  failure: StructuredToolFailureOutput | null,
): string | undefined {
  if (state === "approval") {
    return getActionToolApprovalDescription(toolName);
  }

  if (state === "failure") {
    return failure?.error.userMessage;
  }

  if (state === "denied") {
    return "Bạn đã từ chối thao tác này. Không có thay đổi nào được thực hiện.";
  }

  switch (toolName) {
    case "createReturnSlot":
      return "Đã tạo giữ chỗ trả xe thành công.";
    case "switchReturnSlot":
      return "Đã đổi sang trạm giữ chỗ trả xe mới.";
    case "cancelReturnSlot":
      return "Đã hủy giữ chỗ trả xe hiện tại.";
    default:
      return undefined;
  }
}

function getAiAssistantActionCard(part: ToolPart): AiAssistantActionCard | null {
  const toolName = getToolName(part);

  if (!isActionToolName(toolName)) {
    return null;
  }

  const failure = getStructuredToolFailureOutput(part);
  const success = getStructuredReturnSlotSuccessOutput(part);
  const state = getActionCardState(part, failure, success);

  if (!state) {
    return null;
  }

  return {
    approvalId: "approval" in part ? part.approval?.id : undefined,
    description: getActionCardDescription(state, toolName, failure),
    key: `action:${part.toolCallId}:${part.state}`,
    state,
    suggestedAction: failure?.error.suggestedAction,
    summaryItems: getActionCardSummaryItems(toolName, part, failure, success),
    title: getActionToolTitle(toolName),
    toolCallId: part.toolCallId,
    toolName,
  } satisfies AiAssistantActionCard;
}

function isStructuredToolFailureOutput(output: unknown): output is StructuredToolFailureOutput {
  if (!output || typeof output !== "object") {
    return false;
  }

  const candidate = output as Record<string, unknown>;
  const error = candidate.error;

  return candidate.ok === false
    && !!error
    && typeof error === "object"
    && typeof (error as Record<string, unknown>).userMessage === "string";
}

function getStructuredToolFailureOutput(part: ToolPart): StructuredToolFailureOutput | null {
  if (part.state !== "output-available" || !("output" in part)) {
    return null;
  }

  return isStructuredToolFailureOutput(part.output) ? part.output : null;
}

function getToolActivityState(part: ToolPart): AiAssistantToolActivityState {
  if (getStructuredToolFailureOutput(part)) {
    return "error";
  }

  const rawState = part.state;

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

function getToolActivityLabel(
  toolName: string,
  state: AiAssistantToolActivityState,
  rawState: ToolPartState,
  structuredFailure: StructuredToolFailureOutput | null,
) {
  if (structuredFailure) {
    return structuredFailure.error.userMessage;
  }

  const copy = TOOL_ACTIVITY_COPY[toolName];

  if (copy) {
    if (rawState === "approval-requested" && copy.approvalRequested) {
      return copy.approvalRequested;
    }

    if (rawState === "output-denied" && copy.denied) {
      return copy.denied;
    }

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
    .filter(part => !isActionToolName(getToolName(part)))
    .map((part) => {
      const toolName = getToolName(part);
      const structuredFailure = getStructuredToolFailureOutput(part);
      const state = getToolActivityState(part);

      return {
        approvalId: "approval" in part ? part.approval?.id : undefined,
        errorText: part.errorText,
        key: `${part.toolCallId}:${part.state}`,
        label: part.title ?? getToolActivityLabel(toolName, state, part.state, structuredFailure),
        rawState: part.state,
        state,
        toolCallId: part.toolCallId,
        toolName,
      } satisfies AiAssistantToolActivity;
    });
}

export function getAiAssistantActionCards(
  message: AiAssistantMessage,
): AiAssistantActionCard[] {
  return message.parts
    .filter(isToolPart)
    .map(getAiAssistantActionCard)
    .filter((card): card is AiAssistantActionCard => card !== null);
}

export function getAiAssistantContentBlocks(
  message: AiAssistantMessage,
): AiAssistantContentBlock[] {
  const blocks: AiAssistantContentBlock[] = [];

  for (const part of message.parts) {
    if (part.type === "text") {
      if (!part.text.trim()) {
        continue;
      }

      const previousBlock = blocks[blocks.length - 1];

      if (previousBlock?.kind === "text") {
        previousBlock.markdown = `${previousBlock.markdown}${part.text}`;
        continue;
      }

      blocks.push({
        key: `text:${blocks.length}`,
        kind: "text",
        markdown: part.text,
      });
      continue;
    }

    if (!isToolPart(part)) {
      continue;
    }

    const actionCard = getAiAssistantActionCard(part);

    if (actionCard) {
      blocks.push({
        card: actionCard,
        key: actionCard.key,
        kind: "action-card",
      });
      continue;
    }

    const toolActivities = getAiAssistantToolActivities({
      ...message,
      parts: [part],
    });

    for (const activity of toolActivities) {
      blocks.push({
        activity,
        key: activity.key,
        kind: "tool-activity",
      });
    }
  }

  return blocks;
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
    .map((message) => {
      const markdown = getAiAssistantMessageMarkdown(message);
      const actionCards = getAiAssistantActionCards(message);
      const contentBlocks = getAiAssistantContentBlocks(message);
      const isStreaming = isAiAssistantMessageStreaming(message);
      const toolActivities = getAiAssistantToolActivities(message);

      return {
        actionCards,
        contentBlocks,
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
