import { useNavigation } from "@react-navigation/native";
import { spaceScale } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";
import React from "react";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { useTheme, YStack } from "tamagui";

import type { StaffBikeSwapListNavigationProp } from "@/types/navigation";

import { useStaffBikeSwapListScreen } from "@/screen/staff/bike-swap/list/hooks/use-staff-bike-swap-list-screen";

import { BikeSwapErrorState, BikeSwapLoadingState } from "../shared";
import { BikeSwapRequestRow } from "./components/bike-swap-request-row";
import { BikeSwapTabBar } from "./components/bike-swap-tab-bar";
import { EmptyState } from "./components/empty-state";

export default function StaffBikeSwapListScreen() {
  const navigation = useNavigation<StaffBikeSwapListNavigationProp>();
  const theme = useTheme();
  const {
    activeTab,
    handleRefresh,
    isError,
    isInitialLoading,
    isRefreshing,
    pendingCount,
    setActiveTab,
    visibleRequests,
  } = useStaffBikeSwapListScreen();

  const header = (
    <AppHeroHeader
      footer={(
        <BikeSwapTabBar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          pendingCount={pendingCount}
        />
      )}
      onBack={() => navigation.goBack()}
      size="compact"
      title="Quản lý Đổi Xe"
    />
  );
  const contentTopInset = spaceScale[3];

  if (isInitialLoading) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        {header}
        <BikeSwapLoadingState message="Đang tải danh sách yêu cầu đổi xe..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        {header}
        <BikeSwapErrorState
          description="Vui lòng thử lại sau hoặc làm mới danh sách từ màn hình này."
          onRetry={() => {
            void handleRefresh();
          }}
          title="Không thể tải yêu cầu đổi xe"
        />
      </Screen>
    );
  }

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spaceScale[7] }}
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
        <YStack>
          {header}

          <YStack gap="$4" marginTop={contentTopInset} padding="$4">
            {visibleRequests.length > 0
              ? visibleRequests.map(request => (
                  <BikeSwapRequestRow
                    key={request.id}
                    onPress={bikeSwapRequestId => navigation.navigate("StaffBikeSwapDetail", { bikeSwapRequestId })}
                    request={request}
                  />
                ))
              : (
                  <EmptyState
                    description={activeTab === "PENDING"
                      ? "Hiện tại không có yêu cầu đổi xe nào cần xử lý tại trạm của bạn."
                      : "Chưa có yêu cầu đổi xe đã xử lý trong danh sách gần đây."}
                    title={activeTab === "PENDING" ? "Không có yêu cầu chờ xử lý" : "Chưa có lịch sử đổi xe"}
                  />
                )}
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}
