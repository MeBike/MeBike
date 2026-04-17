import type { UploadIncidentImagePayload } from "@services/incidents";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths } from "@theme/metrics";
import { fontSizes, fontWeights } from "@theme/typography";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Field } from "@ui/primitives/field";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import {
  getIncidentTypeLabel,
  incidentTypeOptions,
} from "@/screen/incidents/incident-presenters";

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
  onSelect: (params: { description: string; imageUploads: UploadIncidentImagePayload[]; incidentType: string }) => Promise<void> | void;
};

type IncidentTypeChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function IncidentTypeChip({ label, onPress, selected }: IncidentTypeChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.84 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <XStack
        alignItems="center"
        backgroundColor={selected ? "$surfaceAccent" : "$surfaceDefault"}
        borderColor={selected ? "$borderFocus" : "$borderSubtle"}
        borderRadius="$round"
        borderWidth={borderWidths.subtle}
        gap="$2"
        paddingHorizontal="$4"
        paddingVertical="$3"
      >
        {selected
          ? <IconSymbol color="#2563eb" name="check-circle" size="caption" />
          : null}
        <AppText tone={selected ? "brand" : "muted"} variant="bodySmall">
          {label}
        </AppText>
      </XStack>
    </Pressable>
  );
}

export function IncidentTypeSheet({
  visible,
  bottomInset,
  isSubmitting,
  onClose,
  onSelect,
}: IncidentTypeSheetProps) {
  const theme = useTheme();
  const [incidentDescription, setIncidentDescription] = useState("");
  const [selectedIncidentType, setSelectedIncidentType] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [inputHeight, setInputHeight] = useState(112);
  const [isStartingSubmit, setStartingSubmit] = useState(false);
  const [isPickingImages, setPickingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<UploadIncidentImagePayload[]>([]);
  const submitLockRef = useRef(false);

  const trimmedIncidentDescription = incidentDescription.trim();
  const showDescriptionError = hasSubmitted && trimmedIncidentDescription.length === 0;
  const showTypeError = hasSubmitted && !selectedIncidentType;
  const isBusy = isSubmitting || isStartingSubmit || isPickingImages;

  useEffect(() => {
    if (!visible && !isBusy) {
      setIncidentDescription("");
      setSelectedIncidentType(null);
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

    if (!selectedIncidentType || trimmedIncidentDescription.length === 0) {
      return;
    }

    submitLockRef.current = true;
    setStartingSubmit(true);

    try {
      await onSelect({
        description: trimmedIncidentDescription,
        imageUploads: selectedImages,
        incidentType: selectedIncidentType,
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
                  Chọn loại sự cố rồi thêm mô tả ngắn. Ứng dụng sẽ dùng vị trí hiện tại để điều phối hỗ trợ.
                </AppText>
              </YStack>
            </YStack>

            <Field
              description="Chọn loại phù hợp nhất để kỹ thuật viên ưu tiên đúng vấn đề cần xử lý."
              error={showTypeError ? "Cần chọn loại sự cố." : undefined}
              label="Loại sự cố"
            >
              <XStack flexWrap="wrap" gap="$3">
                {incidentTypeOptions.map(option => (
                  <IncidentTypeChip
                    key={option}
                    label={getIncidentTypeLabel(option)}
                    onPress={() => setSelectedIncidentType(option)}
                    selected={selectedIncidentType === option}
                  />
                ))}
              </XStack>
            </Field>

            <Field
              description="Ví dụ: phanh bị kẹt, xích tuột, xe va chạm, bánh xe khó đạp..."
              error={showDescriptionError ? "Cần nhập mô tả ngắn về sự cố." : undefined}
              label="Mô tả chi tiết"
            >
              <XStack
                alignItems="flex-start"
                backgroundColor="$surfaceDefault"
                borderColor={showDescriptionError ? "$borderDanger" : "$borderDefault"}
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
                  onChangeText={setIncidentDescription}
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
                  value={incidentDescription}
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
