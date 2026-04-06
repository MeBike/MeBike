import { useNavigation, useRoute } from "@react-navigation/native";
import { borderWidths, spaceScale } from "@theme/metrics";
import { Screen } from "@ui/primitives/screen";
import React, { useState } from "react";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import type {
  StaffBikeSwapDetailNavigationProp,
  StaffBikeSwapDetailRouteProp,
} from "@/types/navigation";

import { useStaffBikeSwapDetailScreen } from "@/screen/staff/bike-swap/detail/hooks/use-staff-bike-swap-detail-screen";
import { AppHeroHeader } from "@/ui/patterns/app-hero-header";
import { AppButton } from "@/ui/primitives/app-button";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";

import {
  BikeSwapErrorState,
  BikeSwapLoadingState,
  getBikeSwapRequestCode,
} from "../shared";
import { RejectReasonSheet } from "./components/reject-reason-sheet";
import { RequestBikeCard } from "./components/request-bike-card";
import { RequestCustomerCard } from "./components/request-customer-card";
import { RequestStatusCard } from "./components/request-status-card";

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText tone="subtle" variant="eyebrow">
      {children}
    </AppText>
  );
}

export default function StaffBikeSwapDetailScreen() {
  const navigation = useNavigation<StaffBikeSwapDetailNavigationProp>();
  const route = useRoute<StaffBikeSwapDetailRouteProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { bikeSwapRequestId } = route.params;
  const [contentHeight, setContentHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const {
    closeRejectSheet,
    handleApprove,
    handleRefresh,
    handleSubmitReject,
    isDecisionPending,
    isError,
    isInitialLoading,
    isRefreshing,
    isRejectSheetOpen,
    openRejectSheet,
    rejectReason,
    request,
    setRejectReason,
  } = useStaffBikeSwapDetailScreen({
    bikeSwapRequestId,
    onResolved: () => navigation.goBack(),
  });

  const header = (
    <AppHeroHeader
      onBack={() => navigation.goBack()}
      size="default"
      subtitle={request ? getBikeSwapRequestCode(request.id) : getBikeSwapRequestCode(bikeSwapRequestId)}
      title="Chi tiết đổi xe"
      titleVariant="sectionTitle"
      variant="surface"
    />
  );
  const needsFooterSpacer = request?.status === "PENDING"
    && contentHeight + footerHeight > viewportHeight;
  const bottomContentPadding = request?.status === "PENDING"
    ? needsFooterSpacer
      ? footerHeight + spaceScale[3]
      : spaceScale[4]
    : spaceScale[7];

  if (isInitialLoading) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        {header}
        <BikeSwapLoadingState message="Đang tải chi tiết yêu cầu đổi xe..." />
      </Screen>
    );
  }

  if (isError || !request) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        {header}
        <BikeSwapErrorState
          description="Vui lòng thử lại sau hoặc làm mới dữ liệu từ màn hình này."
          onRetry={() => {
            void handleRefresh();
          }}
          title="Không thể tải chi tiết đổi xe"
        />
      </Screen>
    );
  }

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />

      {header}

      <ScrollView
        onLayout={(event) => {
          setViewportHeight(event.nativeEvent.layout.height);
        }}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: bottomContentPadding,
        }}
        refreshControl={(
          <RefreshControl
            colors={[theme.actionPrimary.val]}
            refreshing={isRefreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={theme.actionPrimary.val}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <YStack
          gap="$4"
          onLayout={(event) => {
            setContentHeight(event.nativeEvent.layout.height);
          }}
          padding="$4"
        >
          <RequestStatusCard createdAt={request.createdAt} status={request.status} />

          {request.status === "REJECTED" && request.reason
            ? (
                <AppCard borderRadius={28} chrome="flat" gap="$2" padding="$4" tone="danger">
                  <AppText tone="danger" variant="label">
                    Lý do từ chối
                  </AppText>
                  <AppText variant="bodySmall">{request.reason}</AppText>
                </AppCard>
              )
            : null}

          <YStack gap="$3">
            <SectionLabel>Khách hàng</SectionLabel>
            <RequestCustomerCard rentalId={request.rentalId} user={request.user} />
          </YStack>

          <YStack gap="$3">
            <SectionLabel>Thông tin xe</SectionLabel>
            <RequestBikeCard request={request} />
          </YStack>
        </YStack>
      </ScrollView>

      {request.status === "PENDING"
        ? (
            <YStack
              backgroundColor="$surfaceDefault"
              borderTopColor="$borderSubtle"
              borderTopWidth={borderWidths.subtle}
              bottom={0}
              gap="$3"
              left={0}
              onLayout={(event) => {
                setFooterHeight(event.nativeEvent.layout.height);
              }}
              paddingHorizontal="$4"
              paddingTop="$3"
              paddingBottom={Math.max(insets.bottom, spaceScale[4])}
              position="absolute"
              right={0}
            >
              <XStack gap="$3">
                <AppButton
                  buttonSize="large"
                  backgroundColor="$surfaceDanger"
                  borderColor="$surfaceDanger"
                  flex={1}
                  onPress={openRejectSheet}
                  pressStyle={{
                    backgroundColor: theme.surfaceDanger.val,
                    borderColor: theme.surfaceDanger.val,
                    opacity: 1,
                    scale: 0.985,
                  }}
                >
                  <AppText tone="danger" variant="bodyStrong">
                    Từ chối
                  </AppText>
                </AppButton>

                <AppButton buttonSize="large" flex={2} loading={isDecisionPending} onPress={handleApprove} tone="primary">
                  Chấp nhận đổi xe
                </AppButton>
              </XStack>
            </YStack>
          )
        : null}

      <RejectReasonSheet
        isSubmitting={isDecisionPending}
        isVisible={isRejectSheetOpen}
        onChangeVisible={(visible) => {
          if (!visible) {
            closeRejectSheet();
            return;
          }

          openRejectSheet();
        }}
        onReasonChange={setRejectReason}
        onSubmit={handleSubmitReject}
        reason={rejectReason}
      />
    </Screen>
  );
}
