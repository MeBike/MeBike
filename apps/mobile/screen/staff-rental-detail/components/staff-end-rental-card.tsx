import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations, spaceScale } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppInput } from "@ui/primitives/app-input";
import { AppText } from "@ui/primitives/app-text";
import { formatVietnamDateTime } from "@utils/date";
import React from "react";
import { Modal, Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { RentalDetail } from "@/types/rental-types";

type Props = {
  bottomInset: number;
  booking: RentalDetail;
  isSubmitting: boolean;
  isVisible: boolean;
  note: string;
  onChangeVisible: (visible: boolean) => void;
  onNoteChange: (value: string) => void;
  onSubmit: (payload: {
    confirmedAt?: string;
    confirmationMethod?: "MANUAL" | "QR_CODE";
    reason: string;
    stationId: string;
  }) => void;
};

const DEFAULT_REASON = "Kết thúc phiên thuê bởi nhân viên";

export default function StaffEndRentalCard({
  bottomInset,
  booking,
  isSubmitting,
  isVisible,
  note,
  onChangeVisible,
  onNoteChange,
  onSubmit,
}: Props) {
  const theme = useTheme();
  const activeReturnSlot = booking.returnSlot;
  const canEndRental = booking.status === "RENTED" && Boolean(activeReturnSlot);

  const handleConfirm = () => {
    if (!activeReturnSlot) {
      onSubmit({ reason: note, stationId: "" });
      return;
    }

    onSubmit({
      confirmationMethod: "MANUAL",
      reason: note.trim() ? note.trim() : DEFAULT_REASON,
      stationId: activeReturnSlot.station.id,
    });
  };

  return (
    <>
      <YStack
        backgroundColor="$surfaceDefault"
        borderTopColor="$borderSubtle"
        borderTopWidth={borderWidths.subtle}
        gap="$4"
        paddingHorizontal="$5"
        paddingTop="$4"
        paddingBottom={Math.max(bottomInset, spaceScale[4])}
      >
        <AppButton
          buttonSize="large"
          disabled={!canEndRental}
          onPress={() => onChangeVisible(true)}
          tone={canEndRental ? "secondary" : "soft"}
        >
          <XStack alignItems="center" gap="$2">
            <IconSymbol
              color={canEndRental ? theme.onActionSecondary.val : theme.textTertiary.val}
              name={canEndRental ? "checkmark.circle.fill" : "lock.shield.fill"}
              size={20}
            />
            <AppText tone={canEndRental ? "inverted" : "muted"} variant="bodyStrong">
              Kết thúc phiên cho khách
            </AppText>
          </XStack>
        </AppButton>
      </YStack>

      <Modal animationType="fade" onRequestClose={() => onChangeVisible(false)} transparent visible={isVisible}>
        <Pressable
          onPress={() => onChangeVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable onPress={() => {}}>
            <AppCard
              borderRadius="$5"
              chrome="flat"
              gap="$5"
              margin="$4"
              padding="$0"
              style={elevations.medium}
            >
              <YStack gap="$4" padding="$6">
                <YStack gap="$2">
                  <AppText variant="sectionTitle">Xác nhận thu xe</AppText>
                  <AppText tone="muted" variant="bodySmall">
                    Bạn đang kết thúc phiên tại trạm
                    {" "}
                    <AppText tone="default" variant="bodyStrong">
                      {activeReturnSlot?.station.name ?? "--"}
                    </AppText>
                    .
                  </AppText>
                </YStack>

                <AppCard
                  borderColor={activeReturnSlot ? "$borderSubtle" : "$borderDanger"}
                  borderRadius="$4"
                  borderWidth={borderWidths.subtle}
                  chrome="flat"
                  gap="$3"
                  padding="$4"
                  tone={activeReturnSlot ? "muted" : "danger"}
                >
                  <XStack alignItems="flex-start" gap="$3">
                    <YStack
                      alignItems="center"
                      backgroundColor="$surfaceDefault"
                      borderRadius="$round"
                      height={36}
                      justifyContent="center"
                      width={36}
                    >
                      <IconSymbol
                        color={activeReturnSlot ? theme.statusWarning.val : theme.statusDanger.val}
                        name={activeReturnSlot ? "location.fill" : "exclamationmark.triangle.fill"}
                        size={16}
                      />
                    </YStack>

                    <YStack flex={1} gap="$1">
                      <AppText variant="bodyStrong">
                        {activeReturnSlot ? activeReturnSlot.station.name : "Khách chưa đặt chỗ trả xe"}
                      </AppText>
                      <AppText tone="muted" variant="bodySmall">
                        {activeReturnSlot
                          ? `Giữ chỗ từ ${formatVietnamDateTime(activeReturnSlot.reservedFrom)}`
                          : "Yêu cầu khách chọn bãi trả xe trong ứng dụng trước khi tiếp tục."}
                      </AppText>
                    </YStack>
                  </XStack>
                </AppCard>

                <YStack gap="$2">
                  <AppText variant="subhead">Ghi chú (Tùy chọn)</AppText>
                  <AppInput
                    multiline
                    numberOfLines={3}
                    onChangeText={onNoteChange}
                    placeholder="Ví dụ: Khách trả xe tại quầy B2"
                    style={{
                      minHeight: spaceScale[10],
                      paddingTop: spaceScale[3],
                    }}
                    textAlignVertical="top"
                    value={note}
                  />
                </YStack>
              </YStack>

              <XStack
                backgroundColor="$backgroundSubtle"
                borderTopColor="$borderSubtle"
                borderTopWidth={borderWidths.subtle}
                gap="$3"
                padding="$4"
              >
                <AppButton flex={1} onPress={() => onChangeVisible(false)} tone="outline">
                  Hủy
                </AppButton>
                <AppButton flex={2} loading={isSubmitting} onPress={handleConfirm} tone="primary">
                  Kết thúc ngay
                </AppButton>
              </XStack>
            </AppCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
