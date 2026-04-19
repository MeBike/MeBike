import type { ScrollView as ScrollViewType } from "react-native";

import { useAiAssistantChat } from "@hooks/ai/use-ai-assistant-chat";
import { mapAiAssistantMessagesToFeed } from "@services/ai";
import { borderWidths, radii, spaceScale, spacingRules } from "@theme/metrics";
import { AppComposerInput } from "@ui/primitives/app-composer-input";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

import {
  AssistantBubble,
  AssistantErrorCard,
  AssistantHeader,
  AssistantMessageBlock,
  ComposerActionButton,
  SuggestionChip,
  TypingIndicator,
  UserMessageBlock,
} from "./components";
import { INTRO_MARKDOWN, SUGGESTED_PROMPTS } from "./constants";
import { getAiAssistantErrorMessage } from "./helpers";

export default function AiAssistantScreen() {
  const insets = useSafeAreaInsets();
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
  const errorMessage = getAiAssistantErrorMessage(error);
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
    } finally {
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
            <AssistantHeader working={isAssistantWorking} />
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
              {!hasConversation ? <AssistantBubble markdown={INTRO_MARKDOWN} /> : null}

              {feedMessages.map(message => (
                <YStack key={message.id}>
                  {message.role === "user"
                    ? <UserMessageBlock message={message} />
                    : <AssistantMessageBlock message={message} />}
                </YStack>
              ))}

              {shouldShowTyping ? <TypingIndicator /> : null}
              {errorMessage ? <AssistantErrorCard message={errorMessage} /> : null}
            </ScrollView>

            <YStack
              backgroundColor="$surfaceDefault"
              borderTopColor="$borderSubtle"
              borderTopWidth={borderWidths.subtle}
              gap="$3"
              paddingHorizontal="$4"
              paddingTop="$3"
              paddingBottom={insets.bottom}
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

                <AppText align="center" marginTop="$2" tone="subtle" variant="caption">
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
