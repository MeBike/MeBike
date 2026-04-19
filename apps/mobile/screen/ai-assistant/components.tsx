import type {
  AiAssistantFeedMessage,
  AiAssistantToolActivity,
  AiAssistantToolActivityState,
} from "@services/ai";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, spaceScale } from "@theme/metrics";
import { fontFaces, fontSizes, fontWeights, lineHeights } from "@theme/typography";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Check, SendHorizontal, Sparkles, TriangleAlert } from "lucide-react-native";
import { Fragment } from "react";
import { ActivityIndicator, Pressable, useColorScheme } from "react-native";
import { useMarkdown } from "react-native-marked";
import { useTheme, XStack, YStack } from "tamagui";

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
        fontSize: fontSizes.base,
        fontWeight: fontWeights.regular,
        lineHeight: lineHeights.base,
      },
      paragraph: {
        marginBottom: spaceScale[1],
      },
      strong: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.semibold,
        fontWeight: fontWeights.semibold,
      },
      em: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.medium,
        fontWeight: fontWeights.medium,
      },
      link: {
        color: theme.textBrand.val,
        fontFamily: fontFaces.medium,
        fontWeight: fontWeights.medium,
      },
      h1: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.bold,
        fontSize: fontSizes.xxl,
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.xxl,
      },
      h2: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.bold,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.xl,
      },
      h3: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.semibold,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.lg,
      },
      li: {
        color: theme.textPrimary.val,
        fontFamily: fontFaces.regular,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.regular,
        lineHeight: lineHeights.base,
      },
      list: {
        marginBottom: spaceScale[2],
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
        fontWeight: fontWeights.medium,
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

export function AssistantMessageBlock({ message }: { message: AiAssistantFeedMessage }) {
  return (
    <YStack alignItems="flex-start" gap="$2">
      {message.toolActivities.map((activity, index) => (
        <YStack key={activity.key} marginTop={index > 0 ? -spaceScale[1] : 0}>
          <ToolActivityRow activity={activity} />
        </YStack>
      ))}

      {message.hasTextContent ? <AssistantBubble markdown={message.markdown} /> : null}
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
