import type { OpenRouterUsageAccounting } from "@openrouter/ai-sdk-provider";

import logger from "@/lib/logger";

import type { CustomerAssistantUIMessage } from "../messages/customer-assistant-ui";

type ToolCallLike = {
  readonly dynamic?: boolean;
  readonly input?: unknown;
  readonly toolCallId?: string;
  readonly toolName?: string;
};

type ToolResultLike = ToolCallLike & {
  readonly output?: unknown;
};

type StreamChunkLike = {
  readonly chunk: {
    readonly type: string;
  };
};

type StreamStepStartLike = {
  readonly stepNumber: number;
};

type StreamToolCallStartLike = {
  readonly stepNumber?: number;
  readonly toolCall: ToolCallLike;
};

type StreamToolCallFinishLike = {
  readonly durationMs: number;
  readonly error?: unknown;
  readonly output?: unknown;
  readonly stepNumber?: number;
  readonly success: boolean;
  readonly toolCall: ToolCallLike;
};

type StreamStepLike = {
  readonly finishReason: string;
  readonly rawFinishReason?: string | null;
  readonly reasoningText?: string | null;
  readonly stepNumber: number;
  readonly text: string | undefined;
  readonly toolCalls: readonly ToolCallLike[];
  readonly toolResults: readonly ToolResultLike[];
};

type StreamStepFinishLike = StreamStepLike & {
  readonly usage: {
    readonly cachedInputTokens?: number;
    readonly completionTokens?: number;
    readonly inputTokens?: number;
    readonly outputTokenDetails?: {
      readonly reasoningTokens?: number;
      readonly textTokens?: number;
    };
    readonly outputTokens?: number;
    readonly totalTokens?: number;
  };
};

type StreamFinishLike = {
  readonly finishReason: string;
  readonly providerMetadata?: unknown;
  readonly rawFinishReason?: string | null;
  readonly response: {
    readonly id: string;
  };
  readonly steps: readonly StreamStepLike[];
  readonly warnings?: readonly unknown[];
};

type CreateAiStreamLoggingHooksArgs = {
  readonly activeToolCount: number;
  readonly chatId: string | null;
  readonly latestUserMessagePreview: string | null;
  readonly messageCount: number;
  readonly messageConversionDurationMs: number;
  readonly model: string;
  readonly modelMessageCount: number;
  readonly reasoningEffort: string;
  readonly requestPreparationDurationMs: number;
  readonly validationDurationMs: number;
};

export function getOpenRouterUsageAccounting(providerMetadata: unknown): OpenRouterUsageAccounting | null {
  if (!providerMetadata || typeof providerMetadata !== "object") {
    return null;
  }

  const openrouter = (providerMetadata as { openrouter?: { usage?: OpenRouterUsageAccounting } }).openrouter;
  return openrouter?.usage ?? null;
}

export function formatAiUsageMetrics(usage: OpenRouterUsageAccounting | null) {
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

export function truncateText(value: string | null | undefined, maxLength = 240) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength)}...`;
}

export function serializeForLog(value: unknown, maxLength = 800) {
  if (value === undefined) {
    return undefined;
  }

  try {
    const serialized = JSON.stringify(value);

    if (!serialized) {
      return serialized;
    }

    return serialized.length <= maxLength
      ? serialized
      : `${serialized.slice(0, maxLength)}...`;
  }
  catch {
    return String(value);
  }
}

export function summarizeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    value: serializeForLog(error, 400),
  };
}

export function summarizeToolCallForLog(toolCall: ToolCallLike) {
  return {
    dynamic: toolCall.dynamic ?? false,
    inputPreview: serializeForLog(toolCall.input, 500),
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
  };
}

export function summarizeToolResultForLog(toolResult: ToolResultLike) {
  return {
    ...summarizeToolCallForLog(toolResult),
    outputPreview: serializeForLog(toolResult.output, 700),
  };
}

export function summarizeLatestUserMessage(messages: readonly CustomerAssistantUIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role !== "user") {
      continue;
    }

    const text = message.parts
      .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
      .map(part => part.text)
      .join(" ");

    return truncateText(text, 240);
  }

  return null;
}

export function summarizeStepUsageForLog(usage: {
  cachedInputTokens?: number;
  completionTokens?: number;
  inputTokens?: number;
  outputTokenDetails?: {
    reasoningTokens?: number;
    textTokens?: number;
  };
  outputTokens?: number;
  totalTokens?: number;
}) {
  return {
    cachedInputTokens: usage.cachedInputTokens ?? 0,
    completionTokens: usage.completionTokens ?? usage.outputTokens ?? 0,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    reasoningTokens: usage.outputTokenDetails?.reasoningTokens ?? 0,
    textTokens: usage.outputTokenDetails?.textTokens ?? usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
  };
}

export function elapsedMsSince(startTime: number) {
  return Number((performance.now() - startTime).toFixed(1));
}

export function createAiStreamLoggingHooks(args: CreateAiStreamLoggingHooksArgs) {
  const streamLifecycleStartedAt = performance.now();
  const stepStartedAt = new Map<number, number>();
  const stepDurationMs = new Map<number, number>();
  let generationStartedAt: number | null = null;
  let firstStepStartedAt: number | null = null;
  let firstChunkAt: number | null = null;
  let firstToolCallStartedAt: number | null = null;

  logger.info({
    activeToolCount: args.activeToolCount,
    chatId: args.chatId,
    latestUserMessagePreview: args.latestUserMessagePreview,
    messageCount: args.messageCount,
    messageConversionDurationMs: args.messageConversionDurationMs,
    model: args.model,
    modelMessageCount: args.modelMessageCount,
    requestPreparationDurationMs: args.requestPreparationDurationMs,
    reasoningEffort: args.reasoningEffort,
    validationDurationMs: args.validationDurationMs,
  }, "AI stream started");

  return {
    onAbort() {
      logger.info({
        chatId: args.chatId,
        model: args.model,
        reasoningEffort: args.reasoningEffort,
        totalWallTimeMs: elapsedMsSince(streamLifecycleStartedAt),
      }, "AI stream aborted");
    },
    onChunk(event: StreamChunkLike) {
      if (firstChunkAt !== null) {
        return;
      }

      firstChunkAt = performance.now();

      logger.info({
        chatId: args.chatId,
        firstChunkType: event.chunk.type,
        timeToFirstChunkMs: elapsedMsSince(streamLifecycleStartedAt),
      }, "AI first chunk received");
    },
    onFinish(event: StreamFinishLike) {
      const usage = getOpenRouterUsageAccounting(event.providerMetadata);

      logger.info({
        activeToolCount: args.activeToolCount,
        chatId: args.chatId,
        finishReason: event.finishReason,
        model: args.model,
        reasoningEffort: args.reasoningEffort,
        rawFinishReason: event.rawFinishReason,
        responseId: event.response.id,
        steps: event.steps.length,
        stepSummaries: event.steps.map(step => ({
          finishReason: step.finishReason,
          rawFinishReason: step.rawFinishReason,
          reasoningTextPresent: !!step.reasoningText,
          stepDurationMs: stepDurationMs.get(step.stepNumber) ?? null,
          stepNumber: step.stepNumber,
          textPreview: truncateText(step.text, 200),
          toolCalls: step.toolCalls.map(summarizeToolCallForLog),
          toolResults: step.toolResults.map(summarizeToolResultForLog),
        })),
        timeToFirstChunkMs: firstChunkAt === null
          ? null
          : Number((firstChunkAt - streamLifecycleStartedAt).toFixed(1)),
        timeToFirstStepStartMs: firstStepStartedAt === null
          ? null
          : Number((firstStepStartedAt - streamLifecycleStartedAt).toFixed(1)),
        timeToFirstToolCallMs: firstToolCallStartedAt === null
          ? null
          : Number((firstToolCallStartedAt - streamLifecycleStartedAt).toFixed(1)),
        totalGenerationWallTimeMs: generationStartedAt === null
          ? null
          : Number((performance.now() - generationStartedAt).toFixed(1)),
        totalWallTimeMs: elapsedMsSince(streamLifecycleStartedAt),
        usage: formatAiUsageMetrics(usage),
        warnings: event.warnings,
      }, "AI stream finished");
    },
    onResponseError(error: unknown) {
      logger.error({ error }, "AI stream failed");
      return "Assistant unavailable right now. Please try again.";
    },
    onStart() {
      generationStartedAt = performance.now();

      logger.info({
        chatId: args.chatId,
        timeToGenerationStartMs: elapsedMsSince(streamLifecycleStartedAt),
      }, "AI generation lifecycle started");
    },
    onStepFinish(event: StreamStepFinishLike) {
      const startedAt = stepStartedAt.get(event.stepNumber);
      const durationMs = startedAt === undefined ? null : elapsedMsSince(startedAt);

      if (durationMs !== null) {
        stepDurationMs.set(event.stepNumber, durationMs);
      }

      logger.info({
        chatId: args.chatId,
        finishReason: event.finishReason,
        rawFinishReason: event.rawFinishReason,
        reasoningTextPresent: !!event.reasoningText,
        stepDurationMs: durationMs,
        stepNumber: event.stepNumber,
        textPreview: truncateText(event.text, 320),
        toolCalls: event.toolCalls.map(summarizeToolCallForLog),
        toolResults: event.toolResults.map(summarizeToolResultForLog),
        usage: summarizeStepUsageForLog(event.usage),
      }, "AI step finished");
    },
    onStepStart(event: StreamStepStartLike) {
      const startedAt = performance.now();

      stepStartedAt.set(event.stepNumber, startedAt);
      firstStepStartedAt ??= startedAt;

      logger.info({
        chatId: args.chatId,
        stepNumber: event.stepNumber,
        timeToStepStartMs: elapsedMsSince(streamLifecycleStartedAt),
      }, "AI step started");
    },
    onToolCallFinish(event: StreamToolCallFinishLike) {
      const baseLog = {
        chatId: args.chatId,
        durationMs: event.durationMs,
        stepNumber: event.stepNumber,
        toolCall: summarizeToolCallForLog(event.toolCall),
      };

      if (event.success) {
        logger.info({
          ...baseLog,
          toolResult: summarizeToolResultForLog({
            ...event.toolCall,
            output: event.output,
          }),
        }, "AI tool execution finished");
        return;
      }

      logger.warn({
        ...baseLog,
        error: summarizeErrorForLog(event.error),
      }, "AI tool execution failed");
    },
    onToolCallStart(event: StreamToolCallStartLike) {
      firstToolCallStartedAt ??= performance.now();

      logger.info({
        chatId: args.chatId,
        stepNumber: event.stepNumber,
        timeToFirstToolCallMs: firstToolCallStartedAt === null
          ? null
          : Number((firstToolCallStartedAt - streamLifecycleStartedAt).toFixed(1)),
        toolCall: summarizeToolCallForLog(event.toolCall),
      }, "AI tool execution started");
    },
  } as const;
}
