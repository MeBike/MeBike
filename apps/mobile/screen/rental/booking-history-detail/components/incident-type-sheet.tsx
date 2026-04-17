import type { UploadIncidentImagePayload } from "@services/incidents";

import { IconSymbol } from "@components/IconSymbol";
import { fontSizes, fontWeights } from "@theme/typography";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Field } from "@ui/primitives/field";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

function createIncidentImageUploadPayload(asset: ImagePicker.ImagePickerAsset): UploadIncidentImagePayload {
  const extension = asset.fileName?.split(".").pop() ?? asset.mimeType?.split("/").pop() ?? "jpg";

  return {
    uri: asset.uri,
    name: asset.fileName ?? `incident.${extension}`,
    type: asset.mimeType ?? "image/jpeg",
  };
}

type IncidentTypeSheetProps = {
  visible: boolean;
  bottomInset: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSelect: (params: { incidentType: string; imageUploads: UploadIncidentImagePayload[] }) => Promise<void> | void;
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
  const [isPickingImages, setPickingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<UploadIncidentImagePayload[]>([]);
  const submitLockRef = useRef(false);

  const trimmedIncidentType = incidentType.trim();
  const showError = hasSubmitted && trimmedIncidentType.length === 0;
  const isBusy = isSubmitting || isStartingSubmit || isPickingImages;

  useEffect(() => {
    if (!visible && !isBusy) {
      setIncidentType("");
      setHasSubmitted(false);
      setInputHeight(112);
      setSelectedImages([]);
    }
  }, [isBusy, visible]);

  const handlePickImages = async () => {
    if (isBusy) {
      return;
    }

    setPickingImages(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ["images"],
        quality: 1,
        selectionLimit: 5,
      });

      if (result.canceled) {
        return;
      }

      setSelectedImages(result.assets.map(createIncidentImageUploadPayload));
    }
    finally {
      setPickingImages(false);
    }
  };

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
      await onSelect({
        incidentType: trimmedIncidentType,
        imageUploads: selectedImages,
      });
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
                  <IconSymbol color={theme.textTertiary.val} name="tools" size="input" />
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

            <YStack gap="$3">
              <XStack alignItems="center" justifyContent="space-between">
                <YStack gap="$1" flex={1}>
                  <AppText variant="subhead">Hình ảnh sự cố</AppText>
                  <AppText tone="muted" variant="bodySmall">
                    Có thể thêm tối đa 5 ảnh để kỹ thuật viên dễ đánh giá hơn.
                  </AppText>
                </YStack>

                <AppButton buttonSize="compact" disabled={isBusy} onPress={() => { void handlePickImages(); }} tone="outline">
                  {selectedImages.length > 0 ? "Chọn lại" : "Thêm ảnh"}
                </AppButton>
              </XStack>

              {selectedImages.length > 0
                ? (
                    <YStack gap="$2">
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <XStack gap="$3">
                          {selectedImages.map(image => (
                            <YStack
                              key={image.uri}
                              borderColor="$borderSubtle"
                              borderRadius="$4"
                              borderWidth={1}
                              overflow="hidden"
                            >
                              <Image
                                source={{ uri: image.uri }}
                                style={{
                                  width: 88,
                                  height: 88,
                                }}
                              />
                            </YStack>
                          ))}
                        </XStack>
                      </ScrollView>

                      <AppButton disabled={isBusy} onPress={() => setSelectedImages([])} tone="ghost">
                        <AppText tone="muted" variant="bodySmall">
                          Xóa tất cả ảnh đã chọn
                        </AppText>
                      </AppButton>
                    </YStack>
                  )
                : null}
            </YStack>

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
