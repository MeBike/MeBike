import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { LucideIconSymbol as IconSymbol } from "@components/lucide-icon-symbol";
import { fontSizes, fontWeights } from "@theme/typography";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Field } from "@ui/primitives/field";

type IncidentTypeSheetProps = {
  visible: boolean;
  bottomInset: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSelect: (incidentType: string) => Promise<void> | void;
};

export function IncidentTypeSheet({
  visible,
  bottomInset,
  isSubmitting,
  onClose,
  onSelect,
}: IncidentTypeSheetProps) {
  const theme = useTheme();
  const [incidentType, setIncidentType] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [inputHeight, setInputHeight] = useState(112);
  const [isStartingSubmit, setStartingSubmit] = useState(false);
  const submitLockRef = useRef(false);

  const trimmedIncidentType = incidentType.trim();
  const showError = hasSubmitted && trimmedIncidentType.length === 0;
  const isBusy = isSubmitting || isStartingSubmit;

  useEffect(() => {
    if (!visible && !isBusy) {
      setIncidentType("");
      setHasSubmitted(false);
      setInputHeight(112);
    }
  }, [isBusy, visible]);

  const handleSubmit = async () => {
    if (submitLockRef.current || isBusy) {
      return;
    }

    setHasSubmitted(true);

    if (trimmedIncidentType.length === 0) {
      return;
    }

    submitLockRef.current = true;
    setStartingSubmit(true);

    try {
      await onSelect(trimmedIncidentType);
    }
    finally {
      submitLockRef.current = false;
      setStartingSubmit(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={isBusy ? undefined : onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        disabled={isBusy}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: theme.overlayScrim.val,
          justifyContent: "flex-end",
        }}
      >
        <Pressable onPress={() => {}}>
          <AppCard
            borderTopLeftRadius="$6"
            borderTopRightRadius="$6"
            chrome="flat"
            gap="$5"
            padding="$6"
            paddingBottom={bottomInset + 24}
          >
            <YStack alignItems="center" gap="$3">
              <View
                style={{
                  width: 96,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: theme.borderDefault.val,
                  opacity: 0.24,
                }}
              />

              <YStack gap="$2" width="100%">
                <AppText variant="title">
                  Báo cáo sự cố
                </AppText>
                <AppText tone="muted" variant="body">
                  Mô tả ngắn vấn đề đang gặp. Ứng dụng sẽ dùng vị trí hiện tại để điều phối hỗ trợ.
                </AppText>
              </YStack>
            </YStack>

            <Field
              description="Ví dụ: phanh bị kẹt, xích tuột, xe va chạm, bánh xe khó đạp..."
              error={showError ? "Cần nhập mô tả ngắn về sự cố." : undefined}
              label="Sự cố đang gặp"
            >
              <XStack
                alignItems="flex-start"
                backgroundColor="$surfaceDefault"
                borderColor={showError ? "$borderDanger" : "$borderDefault"}
                borderRadius="$4"
                borderWidth={1}
                gap="$3"
                minHeight={112}
                paddingHorizontal="$4"
                paddingVertical="$4"
              >
                <View style={{ paddingTop: 4 }}>
                  <IconSymbol color={theme.textTertiary.val} name="wrench.and.screwdriver.fill" size={18} />
                </View>

                <TextInput
                  autoFocus
                  multiline
                  onChangeText={setIncidentType}
                  onContentSizeChange={(event) => {
                    const nextHeight = Math.min(180, Math.max(112, event.nativeEvent.contentSize.height + 12));
                    setInputHeight(nextHeight);
                  }}
                  placeholder="Nhập mô tả ngắn"
                  placeholderTextColor={theme.textTertiary.val}
                  scrollEnabled={inputHeight >= 180}
                  selectionColor={theme.actionPrimary.val}
                  style={{
                    flex: 1,
                    minHeight: inputHeight,
                    color: theme.textPrimary.val,
                    fontSize: fontSizes.md,
                    fontWeight: fontWeights.medium,
                    paddingTop: 0,
                    paddingBottom: 0,
                    textAlignVertical: "top",
                  }}
                  value={incidentType}
                />
              </XStack>
            </Field>

            <AppButton disabled={isBusy} loading={isBusy} onPress={() => { void handleSubmit(); }} tone="primary">
              {isBusy ? "Đang gửi yêu cầu hỗ trợ..." : "Gửi yêu cầu hỗ trợ"}
            </AppButton>

            <AppButton
              backgroundColor="$surfaceMuted"
              disabled={isBusy}
              onPress={onClose}
              pressStyle={{
                backgroundColor: "$surfaceMuted",
                borderColor: "$borderSubtle",
                opacity: 1,
                scale: 0.985,
              }}
              tone="ghost"
            >
              <AppText tone="muted" variant="subhead">
                Hủy bỏ
              </AppText>
            </AppButton>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
