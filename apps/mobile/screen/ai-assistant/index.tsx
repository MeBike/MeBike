import type {
  AiAssistantFeedMessage,
  AiAssistantToolActivity,
  AiAssistantToolActivityState,
} from "@services/ai";
import type { ScrollView as ScrollViewType } from "react-native";

import { IconSymbol } from "@components/IconSymbol";
import { useAiAssistantChat } from "@hooks/ai/use-ai-assistant-chat";
import { mapAiAssistantMessagesToFeed } from "@services/ai";
import { borderWidths, radii, spaceScale, spacingRules } from "@theme/metrics";
import { fontFaces, fontSizes, fontWeights, lineHeights } from "@theme/typography";
import { AppCard } from "@ui/primitives/app-card";
import { AppComposerInput } from "@ui/primitives/app-composer-input";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import { Check, SendHorizontal, Sparkles, TriangleAlert } from "lucide-react-native";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,

  StatusBar,
  useColorScheme,
} from "react-native";
import { useMarkdown } from "react-native-marked";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

const SUGGESTED_PROMPTS = [
  { icon: "bike" as const, text: "Tôi đang có chuyến thuê nào không?" },
  { icon: "calendar" as const, text: "Cho tôi xem đặt chỗ mới nhất." },
  { icon: "wallet" as const, text: "Ví của tôi hôm nay thế nào?" },
] as const;

const introMarkdown = `Chào bạn! Mình là **Trợ lý MeBike**.

Mình có thể hỗ trợ các câu hỏi liên quan đến:

- tình trạng thuê xe hiện tại
- chi tiết đặt chỗ
- thông tin ví và giao dịch gần đây

Bạn cần giúp gì hôm nay?`;

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

function AssistantMarkdown({ markdown }: { markdown: string }) {
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

function ToolActivityRow({ activity }: { activity: AiAssistantToolActivity }) {
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

function AssistantBubble({ markdown }: { markdown: string }) {
  return (
    <AppCard
      alignSelf="flex-start"
      chrome="flat"
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderTopLeftRadius="$2"
      borderWidth={borderWidths.subtle}
      gap="$2"
      maxWidth="90%"
      padding="$4"
      size="default"
    >
      <AssistantMarkdown markdown={markdown} />
    </AppCard>
  );
}

function AssistantMessageBlock({ message }: { message: AiAssistantFeedMessage }) {
  return (
    <YStack alignItems="flex-start" gap="$2">
      {message.toolActivities.map((activity, index) => (
        <YStack key={activity.key} marginTop={index > 0 ? -spaceScale[1] : 0}>
          <ToolActivityRow activity={activity} />
        </YStack>
      ))}

      {message.hasTextContent
        ? <AssistantBubble markdown={message.markdown} />
        : null}
    </YStack>
  );
}

function UserMessageBlock({ message }: { message: AiAssistantFeedMessage }) {
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

function TypingIndicator() {
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

function SuggestionChip({
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

function ComposerActionButton({
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

export default function AiAssistantScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scrollRef = useRef<ScrollViewType | null>(null);
  const [composerText, setComposerText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const {
    error,
    isBusy,
    messages,
    sendTextMessage,
    stop,
  } = useAiAssistantChat();

  const feedMessages = useMemo(() => mapAiAssistantMessagesToFeed(messages), [messages]);
  const hasRunningToolActivity = useMemo(() => {
    return feedMessages.some(message => message.toolActivities.some(activity => activity.state === "running"));
  }, [feedMessages]);
  const hasConversation = feedMessages.length > 0;
  const canSend = composerText.trim().length > 0;
  const isAssistantWorking = isSending || isBusy || hasRunningToolActivity;
  const shouldShowTyping = isAssistantWorking
    && !hasRunningToolActivity
    && feedMessages[feedMessages.length - 1]?.role === "user";

  const scrollToBottom = useCallback((animated = true) => {
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollToBottom(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [feedMessages, isAssistantWorking, scrollToBottom]);

  const handleSend = useCallback(async (text: string) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    setComposerText("");
    setIsSending(true);

    try {
      await sendTextMessage(trimmedText);
    }
    finally {
      setIsSending(false);
    }
  }, [sendTextMessage]);

  const handleComposerAction = useCallback(() => {
    if (isBusy) {
      stop();
      return;
    }

    void handleSend(composerText);
  }, [composerText, handleSend, isBusy, stop]);

  return (
    <Screen tone="subtle">
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <YStack
            backgroundColor="$actionPrimary"
            borderBottomLeftRadius={radii.xxl}
            borderBottomRightRadius={radii.xxl}
            paddingBottom="$5"
            paddingHorizontal="$5"
            paddingTop={insets.top + spacingRules.hero.paddingTop}
          >
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
                    {isAssistantWorking ? "Đang xử lý" : "Đang hoạt động"}
                  </AppText>
                </XStack>
              </YStack>
            </XStack>
          </YStack>

          <YStack backgroundColor="$backgroundSubtle" flex={1}>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: spacingRules.page.inset,
                paddingTop: spacingRules.page.sectionGap,
                paddingBottom: spacingRules.page.sectionGap,
                gap: spacingRules.page.sectionGap,
              }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                scrollToBottom(hasConversation);
              }}
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
            >
              {!hasConversation
                ? <AssistantBubble markdown={introMarkdown} />
                : null}

              {feedMessages.map(message => (
                <Fragment key={message.id}>
                  {message.role === "user"
                    ? <UserMessageBlock message={message} />
                    : <AssistantMessageBlock message={message} />}
                </Fragment>
              ))}

              {shouldShowTyping ? <TypingIndicator /> : null}

              {error
                ? (
                    <AppCard alignSelf="flex-start" borderTopLeftRadius="$2" gap="$2" maxWidth="92%" tone="danger">
                      <AppText tone="danger" variant="label">
                        Trợ lý tạm thời chưa phản hồi được
                      </AppText>
                      <AppText tone="danger" variant="bodySmall">
                        {error.message}
                      </AppText>
                    </AppCard>
                  )
                : null}
            </ScrollView>

            <YStack
              backgroundColor="$surfaceDefault"
              borderTopColor="$borderSubtle"
              borderTopWidth={borderWidths.subtle}
              gap="$4"
              paddingHorizontal="$4"
              paddingTop="$4"
              paddingBottom={spaceScale[4] + insets.bottom}
            >
              {!hasConversation || feedMessages.length < 3
                ? (
                    <ScrollView
                      horizontal
                      keyboardShouldPersistTaps="handled"
                      showsHorizontalScrollIndicator={false}
                    >
                      <XStack gap="$2" paddingRight="$4">
                        {SUGGESTED_PROMPTS.map(prompt => (
                          <SuggestionChip
                            disabled={isAssistantWorking}
                            icon={prompt.icon}
                            key={prompt.text}
                            onPress={() => {
                              void handleSend(prompt.text);
                            }}
                            text={prompt.text}
                          />
                        ))}
                      </XStack>
                    </ScrollView>
                  )
                : null}

              <YStack gap="$1">
                <AppComposerInput
                  editable={!isAssistantWorking}
                  // leadingAccessory={<Mic color={theme.textSecondary.val} size={20} />}
                  onChangeText={setComposerText}
                  onSubmitEditing={() => {
                    handleComposerAction();
                  }}
                  placeholder="Hỏi trợ lý MeBike..."
                  returnKeyType="send"
                  trailingAccessory={(
                    <ComposerActionButton
                      canStop={isBusy}
                      canSend={canSend}
                      onPress={handleComposerAction}
                      working={isAssistantWorking}
                    />
                  )}
                  value={composerText}
                />

                <AppText align="center" marginTop="$4" tone="subtle" variant="caption">
                  Trợ lý AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
                </AppText>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}
