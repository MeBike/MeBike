import { useNavigation, useRoute } from "@react-navigation/native";
import { borderWidths, spaceScale } from "@theme/metrics";
import { Screen } from "@ui/primitives/screen";
import { StatusBadge } from "@ui/primitives/status-badge";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import type {
  StaffRentalDetailNavigationProp,
  StaffRentalDetailRouteProp,
} from "@/types/navigation";

import { IconSymbol } from "@/components/IconSymbol";
import { AppText } from "@/ui/primitives/app-text";

import DetailErrorState from "../booking-history-detail/components/detail-error-state";
import DetailLoadingState from "../booking-history-detail/components/detail-loading-state";
import StaffEndRentalCard from "./components/staff-end-rental-card";
import { StaffJourneyCard } from "./components/staff-journey-card";
import { StaffPartyCard } from "./components/staff-party-card";
import { StaffSummaryCard } from "./components/staff-summary-card";
import { StaffWarningCard } from "./components/staff-warning-card";
import { useStaffRentalDetailScreen } from "./hooks/use-staff-rental-detail-screen";

const DEFAULT_END_REASON = "Kết thúc phiên thuê bởi nhân viên";

function getStatusMeta(status: string) {
  switch (status) {
    case "RENTED":
      return { label: "ĐANG THUÊ", pulseDot: true, tone: "warning" as const };
    case "COMPLETED":
      return { label: "HOÀN THÀNH", pulseDot: false, tone: "success" as const };
    default:
      return { label: "ĐÃ HỦY", pulseDot: false, tone: "neutral" as const };
  }
}

function StaffRentalDetailScreen() {
  const navigation = useNavigation<StaffRentalDetailNavigationProp>();
  const route = useRoute<StaffRentalDetailRouteProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { rentalId } = route.params;
  const [isEndRentalOpen, setIsEndRentalOpen] = useState(false);
  const [endReason, setEndReason] = useState(DEFAULT_END_REASON);

  const {
    booking,
    handleEndRental,
    isEndingRental,
    isError,
    isInitialLoading,
    isRefreshing,
    onRefresh,
  } = useStaffRentalDetailScreen(rentalId);

  if (isInitialLoading && !booking) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        <DetailLoadingState />
      </Screen>
    );
  }

  if (isError || !booking) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        <DetailErrorState onRetry={() => {
          void onRefresh();
        }}
        />
      </Screen>
    );
  }

  const status = getStatusMeta(booking.status);

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />

      <YStack
        backgroundColor="$surfaceDefault"
        borderBottomColor="$borderSubtle"
        borderBottomWidth={borderWidths.subtle}
        paddingBottom="$4"
        paddingHorizontal="$4"
        paddingTop={insets.top + 8}
      >
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <XStack alignItems="center" flex={1} gap="$3">
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol color={theme.textSecondary.val} name="arrow.left" size={24} />
            </Pressable>

            <AppText numberOfLines={1} variant="sectionTitle">
              Quản lý phiên thuê
            </AppText>
          </XStack>

          <StatusBadge
            label={status.label}
            pulseDot={status.pulseDot}
            size="compact"
            tone={status.tone}
          />
        </XStack>
      </YStack>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? spaceScale[10] : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: spaceScale[6] }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          refreshControl={(
            <RefreshControl
              colors={[theme.actionPrimary.val]}
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.actionPrimary.val}
            />
          )}
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$5" padding="$5">
            <StaffSummaryCard booking={booking} />
            <StaffJourneyCard booking={booking} />

            {booking.status === "RENTED" && !booking.returnSlot
              ? (
                  <StaffWarningCard
                    description="Khách hàng chưa đặt chỗ trả xe. Vui lòng yêu cầu khách chọn bãi trả xe trên ứng dụng trước khi thu xe."
                    title="Không thể kết thúc phiên"
                  />
                )
              : null}

            <StaffPartyCard booking={booking} />
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>

      {booking.status === "RENTED"
        ? (
            <StaffEndRentalCard
              bottomInset={insets.bottom}
              booking={booking}
              isSubmitting={isEndingRental}
              isVisible={isEndRentalOpen}
              note={endReason}
              onChangeVisible={(visible) => {
                setIsEndRentalOpen(visible);
                if (!visible) {
                  setEndReason(DEFAULT_END_REASON);
                }
              }}
              onNoteChange={setEndReason}
              onSubmit={(payload) => {
                handleEndRental(payload, {
                  onSuccess: () => {
                    setIsEndRentalOpen(false);
                    setEndReason(DEFAULT_END_REASON);
                  },
                });
              }}
            />
          )
        : null}
    </Screen>
  );
}

export default StaffRentalDetailScreen;
