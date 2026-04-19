import { Check, SendHorizontal, Sparkles, TriangleAlert } from "lucide-react-native";
import { Fragment } from "react";
import { ActivityIndicator, Pressable, useColorScheme } from "react-native";
import { useMarkdown } from "react-native-marked";
import { useTheme, XStack, YStack } from "tamagui";

import type {
  AiAssistantActionCard,
  AiAssistantFeedMessage,
  AiAssistantToolActivity,
  AiAssistantToolActivityState,
} from "@services/ai";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, spaceScale } from "@theme/metrics";
import { fontFaces, fontSizes, lineHeights } from "@theme/typography";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

function getToolColors(state: AiAssistantToolActivityState) {
  switch (state) {
    case "done":
      return {
        backgroundColor: "$surfaceDefault" as const,
        borderColor: "$borderSubtle" as const,
        iconColorKey: "statusSuccess" as const,
        textTone: "default" as const,
      };
    case "error":
      return {
        backgroundColor: "$surfaceDefault" as const,
        borderColor: "$borderSubtle" as const,
        iconColorKey: "statusDanger" as const,
        textTone: "danger" as const,
      };
    default:
      return {
        backgroundColor: "$surfaceDefault" as const,
        borderColor: "$borderSubtle" as const,
        iconColorKey: "actionPrimary" as const,
        textTone: "default" as const,
      };
  }
}

export function AssistantHeader({ working }: { working: boolean }) {
  const theme = useTheme();

  return (
    <XStack alignItems="center" gap="$3">
      <XStack
        alignItems="center"
        backgroundColor="$overlayGlass"
        borderRadius="$round"
        height={52}
        justifyContent="center"
        width={52}
      >
        <Sparkles color={theme.onSurfaceBrand.val} size={24} />
      </XStack>

      <YStack flex={1} gap="$1">
        <AppText tone="inverted" variant="xlTitle">
          Trợ lý MeBike
        </AppText>

        <XStack alignItems="center" gap="$2">
          <YStack
            backgroundColor="$statusSuccess"
            borderRadius="$round"
            height={8}
            opacity={0.95}
            width={8}
          />
          <AppText opacity={0.92} tone="inverted" variant="bodySmall">
            {working ? "Đang xử lý" : "Đang hoạt động"}
          </AppText>
        </XStack>
      </YStack>
    </XStack>
  );
}

export function AssistantMarkdown({ markdown }: { markdown: string }) {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const elements = useMarkdown(markdown, {
    colorScheme,
    styles: {
      text: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.regular,
        fontSize: fontSizes.md,
        lineHeight: lineHeights.md,
      },
      paragraph: {
        marginBottom: spaceScale[2],
        paddingVertical: 0,
      },
      strong: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.semibold,
      },
      em: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.medium,
      },
      link: {
        color: theme.textBrand.val,
        fontFamily: fontFaces.medium,
      },
      h1: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.bold,
        fontSize: fontSizes.xxl,
        lineHeight: lineHeights.xxl,
      },
      h2: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.bold,
        fontSize: fontSizes.xl,
        lineHeight: lineHeights.xl,
      },
      h3: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.semibold,
        fontSize: fontSizes.lg,
        lineHeight: lineHeights.lg,
      },
      li: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.regular,
        flexShrink: 1,
        fontSize: fontSizes.md,
        lineHeight: lineHeights.md,
        marginBottom: spaceScale[2],
      },
      list: {
        marginBottom: 0,
      },
      blockquote: {
        borderLeftColor: theme.borderFocus.val,
        borderLeftWidth: 3,
        marginBottom: spaceScale[2],
        paddingLeft: spaceScale[3],
      },
      codespan: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.medium,
        fontSize: fontSizes.sm,
      },
    },
  });

  return (
    <YStack gap="$1">
      {elements.map((element, index) => <Fragment key={`assistant-markdown-${index}`}>{element}</Fragment>)}
    </YStack>
  );
}

export function ToolActivityRow({ activity }: { activity: AiAssistantToolActivity }) {
  const theme = useTheme();
  const style = getToolColors(activity.state);
  const iconColor = theme[style.iconColorKey].val;

  return (
    <XStack
      alignItems="center"
      alignSelf="flex-start"
      backgroundColor={style.backgroundColor}
      borderColor={style.borderColor}
      borderRadius="$4"
      borderWidth={borderWidths.subtle}
      gap="$2"
      paddingHorizontal="$4"
      paddingVertical="$3"
    >
      {activity.state === "running"
        ? <ActivityIndicator color={iconColor} size="small" />
        : activity.state === "error"
          ? <TriangleAlert color={iconColor} size={16} />
          : <Check color={iconColor} size={16} />}

      <AppText tone={style.textTone} variant="bodySmall">
        {activity.label}
      </AppText>
    </XStack>
  );
}

export function ToolApprovalActions({
  activity,
  disabled,
  onApprove,
  onDeny,
}: {
  activity: AiAssistantToolActivity;
  disabled: boolean;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}) {
  if (activity.rawState !== "approval-requested" || !activity.approvalId) {
    return null;
  }

  return (
    <XStack gap="$2">
      <AppButton
        buttonSize="compact"
        disabled={disabled}
        onPress={() => onApprove(activity.approvalId!)}
        tone="primary"
      >
        Xác nhận
      </AppButton>
      <AppButton
        buttonSize="compact"
        disabled={disabled}
        onPress={() => onDeny(activity.approvalId!)}
        tone="outline"
      >
        Từ chối
      </AppButton>
    </XStack>
  );
}

function getActionCardAccent(state: AiAssistantActionCard["state"]) {
  switch (state) {
    case "success":
      return {
        iconColorKey: "statusSuccess" as const,
        titleTone: "default" as const,
      };
    case "failure":
    case "denied":
      return {
        iconColorKey: "statusDanger" as const,
        titleTone: "danger" as const,
      };
    default:
      return {
        iconColorKey: "actionPrimary" as const,
        titleTone: "default" as const,
      };
  }
}

function getActionCardStateLabel(state: AiAssistantActionCard["state"]) {
  switch (state) {
    case "approval":
      return "Yêu cầu xác nhận";
    case "success":
      return "Thực hiện thành công";
    case "failure":
      return "Không thể thực hiện";
    case "denied":
      return "Đã từ chối";
    default:
      return "Trạng thái thao tác";
  }
}

function ActionCardIcon({ state }: { state: AiAssistantActionCard["state"] }) {
  const theme = useTheme();
  const accent = getActionCardAccent(state);
  const color = theme[accent.iconColorKey].val;

  if (state === "success") {
    return <Check color={color} size={18} />;
  }

  if (state === "failure" || state === "denied") {
    return <TriangleAlert color={color} size={18} />;
  }

  return <Sparkles color={color} size={18} />;
}

function ActionCardSummary({ items }: { items: AiAssistantActionCard["summaryItems"] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <YStack
      backgroundColor="$surfaceSubtle"
      borderColor="$borderSubtle"
      borderRadius="$4"
      borderWidth={borderWidths.subtle}
      gap="$3"
      padding="$4"
      width="100%"
    >
      {items.map(item => (
        <YStack key={`${item.label}:${item.value}`} gap="$1">
          <AppText tone="subtle" variant="bodySmall">
            {item.label}
          </AppText>
          <AppText variant="bodyStrong">
            {item.value}
          </AppText>
        </YStack>
      ))}
    </YStack>
  );
}

export function ActionToolCard({
  approvalBusy,
  card,
  onApprove,
  onDeny,
}: {
  approvalBusy: boolean;
  card: AiAssistantActionCard;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}) {
  const accent = getActionCardAccent(card.state);

  return (
    <AppCard
      alignSelf="flex-start"
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderTopLeftRadius="$2"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      gap="$4"
      maxWidth="92%"
      padding="$4"
      size="default"
    >
      <XStack alignItems="center" gap="$3">
        <XStack
          alignItems="center"
          backgroundColor="$surfaceSubtle"
          borderRadius="$round"
          height={44}
          justifyContent="center"
          width={44}
        >
          <ActionCardIcon state={card.state} />
        </XStack>

        <YStack flex={1} gap="$1">
          <AppText tone={accent.titleTone} variant="bodyStrong">
            {getActionCardStateLabel(card.state)}
          </AppText>
          <AppText variant="label">{card.title}</AppText>
        </YStack>
      </XStack>

      {card.description
        ? (
            <AppText variant="bodySmall">{card.description}</AppText>
          )
        : null}

      <ActionCardSummary items={card.summaryItems} />

      {card.state === "approval" && card.approvalId
        ? (
            <XStack gap="$2">
              <AppButton
                buttonSize="compact"
                disabled={approvalBusy}
                flex={1}
                onPress={() => onDeny(card.approvalId!)}
                tone="outline"
              >
                Từ chối
              </AppButton>
              <AppButton
                buttonSize="compact"
                disabled={approvalBusy}
                flex={1}
                onPress={() => onApprove(card.approvalId!)}
                tone="primary"
              >
                Xác nhận
              </AppButton>
            </XStack>
          )
        : null}

    </AppCard>
  );
}

export function AssistantBubble({ markdown }: { markdown: string }) {
  return (
    <AppCard
      alignSelf="flex-start"
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderTopLeftRadius="$2"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      gap="$2"
      maxWidth="90%"
      padding="$4"
      size="default"
    >
      <AssistantMarkdown markdown={markdown} />
    </AppCard>
  );
}

export function AssistantMessageBlock({
  approvalBusy,
  message,
  onApproveTool,
  onDenyTool,
}: {
  approvalBusy: boolean;
  message: AiAssistantFeedMessage;
  onApproveTool: (approvalId: string) => void;
  onDenyTool: (approvalId: string) => void;
}) {
  return (
    <YStack alignItems="flex-start" gap="$2">
      {message.contentBlocks.map((block, index) => {
        switch (block.kind) {
          case "action-card":
            return (
              <ActionToolCard
                approvalBusy={approvalBusy}
                card={block.card}
                key={block.key}
                onApprove={onApproveTool}
                onDeny={onDenyTool}
              />
            );
          case "tool-activity":
            return (
              <YStack gap="$2" key={block.key} marginTop={index > 0 ? -spaceScale[1] : 0}>
                <ToolActivityRow activity={block.activity} />
                <ToolApprovalActions
                  activity={block.activity}
                  disabled={approvalBusy}
                  onApprove={onApproveTool}
                  onDeny={onDenyTool}
                />
              </YStack>
            );
          case "text":
            return <AssistantBubble key={block.key} markdown={block.markdown} />;
          default:
            return null;
        }
      })}
    </YStack>
  );
}

export function UserMessageBlock({ message }: { message: AiAssistantFeedMessage }) {
  return (
    <XStack justifyContent="flex-end">
      <YStack
        alignSelf="flex-end"
        backgroundColor="$actionPrimary"
        borderRadius="$5"
        borderTopRightRadius="$2"
        maxWidth="78%"
        paddingHorizontal="$5"
        paddingVertical="$4"
      >
        <AppText tone="inverted" variant="bodyStrong">
          {message.text}
        </AppText>
      </YStack>
    </XStack>
  );
}

export function TypingIndicator() {
  return (
    <AppCard alignSelf="flex-start" borderTopLeftRadius="$2" gap="$2" maxWidth="40%" size="compact">
      <XStack alignItems="center" gap="$2" minHeight={20}>
        <YStack backgroundColor="$textDisabled" borderRadius="$round" height={8} opacity={0.8} width={8} />
        <YStack backgroundColor="$textDisabled" borderRadius="$round" height={8} opacity={0.65} width={8} />
        <YStack backgroundColor="$textDisabled" borderRadius="$round" height={8} opacity={0.5} width={8} />
      </XStack>
    </AppCard>
  );
}

export function AssistantErrorCard({ message }: { message: string }) {
  return (
    <AppCard alignSelf="flex-start" borderTopLeftRadius="$2" gap="$2" maxWidth="92%" tone="danger">
      <AppText tone="danger" variant="label">
        Trợ lý tạm thời chưa phản hồi được
      </AppText>
      <AppText tone="danger" variant="bodySmall">
        {message}
      </AppText>
    </AppCard>
  );
}

export function SuggestionChip({
  disabled,
  icon,
  onPress,
  text,
}: {
  disabled: boolean;
  icon: "bike" | "calendar" | "wallet";
  onPress: () => void;
  text: string;
}) {
  const theme = useTheme();

  return (
    <Pressable disabled={disabled} onPress={onPress}>
      {({ pressed }) => (
        <XStack
          alignItems="center"
          backgroundColor="$surfaceDefault"
          borderColor="$borderSubtle"
          borderRadius="$4"
          borderWidth={borderWidths.subtle}
          gap="$2"
          opacity={disabled ? 0.55 : 1}
          paddingHorizontal="$3"
          paddingVertical="$3"
          transform={[{ scale: pressed ? 0.98 : 1 }]}
        >
          <IconSymbol color={theme.actionPrimary.val} name={icon} size="caption" />
          <AppText tone="default" variant="compactStrong">
            {text}
          </AppText>
        </XStack>
      )}
    </Pressable>
  );
}

export function ComposerActionButton({
  canStop,
  canSend,
  onPress,
  working,
}: {
  canStop: boolean;
  canSend: boolean;
  onPress: () => void;
  working: boolean;
}) {
  const theme = useTheme();
  const isDisabled = working ? !canStop : !canSend;

  return (
    <Pressable disabled={isDisabled} onPress={onPress}>
      {({ pressed }) => (
        <XStack
          alignItems="center"
          backgroundColor={working || canSend ? "$actionPrimary" : "$surfaceMuted"}
          borderRadius="$round"
          height={44}
          justifyContent="center"
          opacity={isDisabled ? 0.7 : 1}
          transform={[{ scale: pressed ? 0.96 : 1 }]}
          width={44}
        >
          {working
            ? <ActivityIndicator color={theme.onActionPrimary.val} size="small" />
            : <SendHorizontal color={canSend ? theme.onActionPrimary.val : theme.textDisabled.val} size={18} />}
        </XStack>
      )}
    </Pressable>
  );
}
