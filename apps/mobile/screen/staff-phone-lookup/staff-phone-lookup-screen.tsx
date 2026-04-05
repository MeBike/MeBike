import type { StackNavigationProp } from "@react-navigation/stack";

import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, StatusBar } from "react-native";
import { Spinner, XStack, YStack } from "tamagui";

import type { RootStackParamList } from "@/types/navigation";
import type { RentalListItem } from "@/types/rental-types";

import { presentRentalError } from "@/presenters/rentals/rental-error-presenter";
import { AppHeroHeader } from "@/ui/patterns/app-hero-header";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { Screen } from "@/ui/primitives/screen";
import { useStaffActiveRentalsByPhone } from "@hooks/query/rentals/use-staff-active-rentals-by-phone";
import { useStationActions } from "@hooks/useStationAction";
import { formatVietnamDateTime } from "@utils/date";

import { EmptyState } from "./components/empty-state";
import { ResultsList } from "./components/results-list";
import { SearchCard } from "./components/search-card";

function formatDate(value?: string | null) {
  if (!value)
    return "-";
  return formatVietnamDateTime(value);
}

function shortenId(value: string) {
  if (!value)
    return "-";
  return value.length > 8 ? `...${value.slice(-6)}` : value;
}

function formatDuration(minutes?: number) {
  if (!minutes || minutes <= 0)
    return "Chưa xác định";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}p` : `${hours}h`;
  }
  return `${mins} phút`;
}

function getStatusTone(status: string) {
  switch (status) {
    case "RENTED":
      return "warning" as const;
    case "COMPLETED":
      return "success" as const;
    case "CANCELLED":
      return "danger" as const;
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
    case "CANCELLED":
      return "Đã hủy";
    case "RESERVED":
      return "Đã đặt trước";
    default:
      return status;
  }
}

export default function StaffPhoneLookupScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchResults, setSearchResults] = useState<RentalListItem[]>([]);
  const [lastSearchedPhone, setLastSearchedPhone] = useState<string | null>(null);
  const lookupMutation = useStaffActiveRentalsByPhone();
  const { stations: stationData, isLoadingGetAllStations } = useStationActions(true);

  const stationNameMap = useMemo(() => {
    if (!stationData)
      return new Map<string, string>();
    return new Map<string, string>(
      stationData.map(station => [station.id, station.name]),
    );
  }, [stationData]);

  const runLookup = (normalized: string) => {
    lookupMutation.mutate(
      { phone: normalized },
      {
        onSuccess: (response) => {
          setSearchResults(response.data ?? []);
          setLastSearchedPhone(normalized);
        },
        onError: (error) => {
          Alert.alert("Lỗi tra cứu", presentRentalError(error));
          setSearchResults([]);
          setLastSearchedPhone(normalized);
        },
      },
    );
  };

  const handleLookup = () => {
    const normalized = phoneNumber.trim();
    if (!normalized) {
      Alert.alert("Thiếu số điện thoại", "Vui lòng nhập số điện thoại hợp lệ.");
      return;
    }
    runLookup(normalized);
  };

  const handleRefresh = () => {
    const nextPhone = lastSearchedPhone ?? phoneNumber.trim();
    if (!nextPhone) {
      return;
    }

    runLookup(nextPhone);
  };

  const lookupButtonDisabled = lookupMutation.isPending || phoneNumber.trim().length === 0;

  const searchSummary = useMemo(() => {
    if (!lastSearchedPhone)
      return null;
    if (lookupMutation.isPending) {
      return `Đang tìm kiếm phiên thuê cho ${lastSearchedPhone}...`;
    }
    return searchResults.length
      ? `Đang hiển thị ${searchResults.length} phiên thuê đang hoạt động cho ${lastSearchedPhone}.`
      : `Không tìm thấy phiên thuê nào cho ${lastSearchedPhone}.`;
  }, [lastSearchedPhone, lookupMutation.isPending, searchResults.length]);

  const renderResults = () => {
    if (lookupMutation.isPending || isLoadingGetAllStations) {
      return (
        <AppCard alignItems="center" borderRadius="$4" chrome="whisper" gap="$3" padding="$5">
          <Spinner color="$textBrand" size="small" />
          <AppText tone="muted" variant="bodySmall">
            Đang tìm phiên thuê đang hoạt động...
          </AppText>
        </AppCard>
      );
    }

    if (!searchResults.length) {
      return <EmptyState hasSearched={Boolean(lastSearchedPhone)} />;
    }

    return (
      <ResultsList
        rentals={searchResults}
        getStationName={id => stationNameMap.get(id) ?? id}
        getStatusText={getStatusText}
        getStatusTone={getStatusTone}
        getBikeLabel={shortenId}
        getStartTimeLabel={formatDate}
        getDurationLabel={formatDuration}
        onSelect={id => navigation.navigate("StaffRentalDetail", { rentalId: id })}
        shortenId={shortenId}
      />
    );
  };

  return (
    <Screen tone="subtle">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <AppHeroHeader
        onBack={() => navigation.goBack()}
        size="compact"
        subtitle="Tìm phiên thuê đang hoạt động của khách."
        title="Tra cứu bằng SĐT"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={(
          <RefreshControl
            refreshing={lookupMutation.isPending}
            onRefresh={handleRefresh}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" padding="$4">
          <SearchCard
            phoneNumber={phoneNumber}
            onPhoneChange={setPhoneNumber}
            onLookup={handleLookup}
            isPending={lookupMutation.isPending}
            isDisabled={lookupButtonDisabled}
            summary={searchSummary}
          />

          {searchResults.length > 0 && !lookupMutation.isPending && !isLoadingGetAllStations
            ? (
                <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$1">
                  <AppText variant="sectionTitle">Kết quả tra cứu</AppText>
                  <AppText tone="muted" variant="caption">
                    {searchResults.length}
                    {" "}
                    phiên thuê
                  </AppText>
                </XStack>
              )
            : null}

          {renderResults()}
        </YStack>
      </ScrollView>
    </Screen>
  );
}
