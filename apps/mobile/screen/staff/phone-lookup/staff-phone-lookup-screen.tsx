import { useNavigation } from "@react-navigation/native";
import React from "react";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, useTheme, XStack, YStack } from "tamagui";

import type { StaffPhoneLookupNavigationProp } from "@/types/navigation";

import { AppText } from "@/ui/primitives/app-text";
import { Screen } from "@/ui/primitives/screen";

import { EmptyState } from "./components/empty-state";
import { ResultsList } from "./components/results-list";
import { SearchCard } from "./components/search-card";
import { useStaffPhoneLookupScreen } from "./hooks";

function getStatusTone(status: string) {
  switch (status) {
    case "RENTED":
      return "warning" as const;
    case "COMPLETED":
      return "success" as const;
    case "RESERVED":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "RENTED":
      return "Đang thuê";
    case "COMPLETED":
      return "Hoàn thành";
    case "RESERVED":
      return "Đã đặt trước";
    default:
      return status;
  }
}

export default function StaffPhoneLookupScreen() {
  const navigation = useNavigation<StaffPhoneLookupNavigationProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    emptyState,
    getStationName,
    handleClear,
    handleLookup,
    handleRefresh,
    isLoading,
    isRefreshing,
    phoneNumber,
    results,
    setPhoneNumber,
    showResultsHeader,
  } = useStaffPhoneLookupScreen();

  return (
    <Screen tone="subtle">
      <StatusBar barStyle="dark-content" backgroundColor={theme.surfaceDefault.val} />

      <YStack
        backgroundColor="$surfaceDefault"
        borderBottomColor="$borderSubtle"
        borderBottomWidth={1}
        paddingBottom="$4"
        paddingTop={insets.top + 8}
      >
        <SearchCard
          onBack={() => navigation.goBack()}
          onClear={handleClear}
          onPhoneChange={setPhoneNumber}
          onSubmit={handleLookup}
          phoneNumber={phoneNumber}
        />
      </YStack>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
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
        <YStack gap="$4" padding="$4" paddingTop="$5">
          {showResultsHeader
            ? (
                <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$1">
                  <AppText tone="muted" variant="sectionTitle">
                    Kết quả tìm kiếm
                  </AppText>
                  <AppText tone="muted" variant="caption">
                    {results.length}
                    {" "}
                    phiên
                  </AppText>
                </XStack>
              )
            : null}

          {isLoading
            ? (
                <YStack alignItems="center" gap="$3" paddingTop="$10">
                  <Spinner color="$textBrand" size="small" />
                  <AppText tone="muted" variant="bodySmall">
                    Đang tìm phiên thuê đang hoạt động...
                  </AppText>
                </YStack>
              )
            : results.length > 0
              ? (
                  <ResultsList
                    rentals={results}
                    getStationName={getStationName}
                    getStatusText={getStatusText}
                    getStatusTone={getStatusTone}
                    onSelect={id => navigation.navigate("StaffRentalDetail", { rentalId: id })}
                  />
                )
              : <EmptyState description={emptyState.description} title={emptyState.title} />}
        </YStack>
      </ScrollView>
    </Screen>
  );
}
