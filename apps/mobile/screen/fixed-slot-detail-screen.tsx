import { useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { StatusBadge } from "@/ui/primitives/status-badge";

import { useFixedSlotDetailScreen } from "./fixed-slot-detail/use-fixed-slot-detail-screen";
import { formatDisplayDate } from "./fixed-slot-detail/utils";

import type {
  FixedSlotDetailNavigationProp,
  FixedSlotDetailRouteProp,
} from "@/types/navigation";

export default function FixedSlotDetailScreen() {
  const navigation = useNavigation<FixedSlotDetailNavigationProp>();
  const route = useRoute<FixedSlotDetailRouteProp>();
  const { templateId } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    template,
    isLoading,
    statusLabel,
    statusTone,
    templateCode,
    canMutate,
    handleNavigateToEditor,
    handleRemoveDate,
    handleCancelTemplate,
  } = useFixedSlotDetailScreen({ navigation, templateId });

  return (
    <Screen tone="subtle">
      <AppHeroHeader
        accessory={statusLabel && statusTone
          ? <StatusBadge label={statusLabel} size="compact" tone={statusTone} withDot />
          : undefined}
        onBack={() => navigation.goBack()}
        size="compact"
        subtitle={`Mã: ${templateCode}`}
        title="Chi tiết khung giờ"
        variant="gradient"
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: canMutate ? 144 : 32 }} style={{ marginTop: -24 }}>
        {isLoading || !template
          ? (
              <Screen alignItems="center" justifyContent="center" minHeight={280} tone="subtle">
                <ActivityIndicator color={theme.actionPrimary.val} size="large" />
              </Screen>
            )
          : (
              <YStack gap="$4">
                <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$5" chrome="card" gap="$4">
                  <StatusBadge
                    label={statusLabel?.toUpperCase() ?? ""}
                    pulseDot={canMutate}
                    size="compact"
                    tone={statusTone}
                    withDot
                  />

                  <YStack gap="$2">
                    <AppText variant="title">{template.station.name}</AppText>
                    <XStack alignItems="flex-start" gap="$2">
                      <IconSymbol color={theme.textTertiary.val} name="location" size="sm" />
                      <AppText flex={1} tone="muted" variant="bodySmall">{template.station.address}</AppText>
                    </XStack>
                  </YStack>

                  <AppCard borderColor="$borderSubtle" borderWidth={1} chrome="flat" gap="$3" tone="accent">
                    <XStack alignItems="center" gap="$3" justifyContent="space-between">
                      <XStack alignItems="center" gap="$3">
                        <XStack alignItems="center" backgroundColor="$surfaceDefault" borderRadius="$3" height={40} justifyContent="center" width={40}>
                          <IconSymbol color={theme.actionPrimary.val} name="clock" size="md" />
                        </XStack>
                        <YStack gap="$1">
                          <AppText tone="brand" variant="eyebrow">Giờ nhận xe</AppText>
                          <AppText variant="headline">{template.slotStart}</AppText>
                        </YStack>
                      </XStack>
                    </XStack>
                  </AppCard>

                  <XStack alignItems="flex-start" gap="$2">
                    <IconSymbol color={theme.textTertiary.val} name="info" size="caption" />
                    <AppText flex={1} tone="muted" variant="caption">
                      Hệ thống sẽ ưu tiên giữ xe cho bạn vào khung giờ này.
                    </AppText>
                  </XStack>
                </AppCard>

                <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$5" chrome="card" gap="$0" overflow="hidden">
                  <XStack alignItems="center" backgroundColor="$surfaceMuted" borderBottomColor="$borderSubtle" borderBottomWidth={1} justifyContent="space-between" paddingHorizontal="$5" paddingVertical="$4">
                    <XStack alignItems="center" gap="$2">
                      <IconSymbol color={theme.textPrimary.val} name="calendar" size="sm" />
                      <AppText variant="bodyStrong">Danh sách ngày ({template.slotDates.length})</AppText>
                    </XStack>
                    {canMutate
                      ? (
                          <Pressable
                            onPress={handleNavigateToEditor}
                          >
                            {({ pressed }) => (
                              <AppText opacity={pressed ? 0.75 : 1} tone="brand" variant="bodySmall">Chỉnh sửa</AppText>
                            )}
                          </Pressable>
                        )
                      : null}
                  </XStack>

                  <YStack padding="$2">
                    {template.slotDates.length === 0
                      ? (
                          <AppText align="center" tone="muted" variant="bodySmall" paddingVertical="$4">
                            Không còn ngày nào.
                          </AppText>
                        )
                      : template.slotDates.map((slotDate, index) => (
                          <XStack
                            key={slotDate}
                            alignItems="center"
                            borderBottomColor={index === template.slotDates.length - 1 ? "transparent" : "$borderSubtle"}
                            borderBottomWidth={1}
                            justifyContent="space-between"
                            paddingHorizontal="$3"
                            paddingVertical="$3"
                          >
                            <AppText variant="bodyStrong">{formatDisplayDate(slotDate)}</AppText>
                            {canMutate
                              ? (
                                  <Pressable onPress={() => handleRemoveDate(slotDate)}>
                                    {({ pressed }) => (
                                      <XStack opacity={pressed ? 0.7 : 1} padding="$2">
                                        <IconSymbol color={theme.textTertiary.val} name="close" size="sm" />
                                      </XStack>
                                    )}
                                  </Pressable>
                                )
                              : null}
                          </XStack>
                        ))}
                  </YStack>
                </AppCard>

                <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$5" chrome="flat" gap="$3" tone="warning">
                  <XStack alignItems="flex-start" gap="$3">
                    <IconSymbol color={theme.textWarning.val} name="warning" size="md" />
                    <YStack flex={1} gap="$1">
                      <AppText tone="warning" variant="bodyStrong">Chính sách phí & hoàn tiền</AppText>
                      <AppText tone="warning" variant="bodySmall">
                        Lịch cố định được thanh toán trước. Việc xóa ngày lẻ hoặc hủy toàn bộ lịch sẽ không được hoàn lại tiền cho các ngày đã thanh toán.
                      </AppText>
                    </YStack>
                  </XStack>
                </AppCard>
              </YStack>
            )}
      </ScrollView>

      {canMutate
        ? (
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
              <AppCard
                backgroundColor="$surfaceDefault"
                borderTopColor="$borderSubtle"
                borderTopWidth={1}
                borderRadius={0}
                chrome="flat"
                padding="$4"
                paddingBottom={insets.bottom + 16}
              >
                <AppButton onPress={handleCancelTemplate} tone="danger">Hủy toàn bộ</AppButton>
              </AppCard>
            </View>
          )
        : null}
    </Screen>
  );
}
