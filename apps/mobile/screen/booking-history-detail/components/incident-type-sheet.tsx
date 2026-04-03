import { LucideIconSymbol as IconSymbol } from "@components/lucide-icon-symbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Field } from "@ui/primitives/field";
import { useEffect, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

type IncidentTypeSheetProps = {
  visible: boolean;
  bottomInset: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSelect: (incidentType: string) => void;
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

  const trimmedIncidentType = incidentType.trim();
  const showError = hasSubmitted && trimmedIncidentType.length === 0;

  useEffect(() => {
    if (!visible && !isSubmitting) {
      setIncidentType("");
      setHasSubmitted(false);
      setInputHeight(112);
    }
  }, [isSubmitting, visible]);

  const handleSubmit = () => {
    setHasSubmitted(true);

    if (trimmedIncidentType.length === 0) {
      return;
    }

    onSelect(trimmedIncidentType);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={isSubmitting ? undefined : onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        disabled={isSubmitting}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(12, 20, 40, 0.36)",
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
                  backgroundColor: "rgba(148, 163, 184, 0.18)",
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
                  <IconSymbol color="#94A3B8" name="wrench.and.screwdriver.fill" size={18} />
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
                    fontSize: 16,
                    fontWeight: "500",
                    paddingTop: 0,
                    paddingBottom: 0,
                    textAlignVertical: "top",
                  }}
                  value={incidentType}
                />
              </XStack>
            </Field>

            <AppButton disabled={isSubmitting} loading={isSubmitting} onPress={handleSubmit} tone="primary">
              {isSubmitting ? "Đang gửi yêu cầu hỗ trợ..." : "Gửi yêu cầu hỗ trợ"}
            </AppButton>

            <AppButton
              backgroundColor="$surfaceMuted"
              disabled={isSubmitting}
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
