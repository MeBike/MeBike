import type { StackNavigationProp } from "@react-navigation/stack";

import { useStaffActiveRentalsByPhone } from "@hooks/query/rentals/use-staff-active-rentals-by-phone";
import { useStationActions } from "@hooks/useStationAction";
import { useNavigation } from "@react-navigation/native";
import { rentalErrorMessage } from "@services/rentals";
import { formatVietnamDateTime } from "@utils/date";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";

import type { RootStackParamList } from "@/types/navigation";
import type { RentalListItem } from "@/types/rental-types";

import BookingDetailHeader from "../booking-history-detail/components/BookingDetailHeader";
import { EmptyState } from "./components/empty-state";
import { ResultsList } from "./components/results-list";
import { SearchCard } from "./components/search-card";
import { styles } from "./styles";

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

function getStatusColor(status: string) {
  switch (status) {
    case "RENTED":
      return "#FF9800";
    case "COMPLETED":
      return "#4CAF50";
    case "CANCELLED":
      return "#F44336";
    case "RESERVED":
      return "#7C3AED";
    default:
      return "#999";
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
      stationData.map(station => [station._id, station.name]),
    );
  }, [stationData]);

  const handleLookup = () => {
    const normalized = phoneNumber.trim();
    if (!normalized) {
      Alert.alert("Thiếu số điện thoại", "Vui lòng nhập số điện thoại hợp lệ.");
      return;
    }
    lookupMutation.mutate(
      { phone: normalized },
      {
        onSuccess: (response) => {
          setSearchResults(response.data ?? []);
          setLastSearchedPhone(normalized);
        },
        onError: (error) => {
          Alert.alert("Lỗi tra cứu", rentalErrorMessage(error));
          setSearchResults([]);
          setLastSearchedPhone(normalized);
        },
      },
    );
  };

  const lookupButtonDisabled
    = lookupMutation.isPending || phoneNumber.trim().length === 0;

  const searchSummary = useMemo(() => {
    if (!lastSearchedPhone)
      return null;
    if (lookupMutation.isPending) {
      return `Đang tìm kiếm thuê xe hoạt động cho ${lastSearchedPhone}...`;
    }
    return searchResults.length
      ? `Đang hiển thị ${searchResults.length} phiên thuê hoạt động cho ${lastSearchedPhone}.`
      : `Không tìm thấy phiên thuê nào cho ${lastSearchedPhone}.`;
  }, [lastSearchedPhone, lookupMutation.isPending, searchResults.length]);

  const renderResults = () => {
    if (lookupMutation.isPending || isLoadingGetAllStations) {
      return null;
    }
    if (!searchResults.length) {
      return <EmptyState />;
    }

    return (
      <ResultsList
        rentals={searchResults}
        getStationName={id => stationNameMap.get(id) ?? id}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        getBikeLabel={shortenId}
        getStartTimeLabel={formatDate}
        getDurationLabel={formatDuration}
        onSelect={id => navigation.navigate("StaffRentalDetail", { rentalId: id })}
        shortenId={shortenId}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <BookingDetailHeader
        title="Tra cứu số điện thoại"
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={(
          <RefreshControl
            refreshing={lookupMutation.isPending}
            onRefresh={handleLookup}
          />
        )}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchCard
          phoneNumber={phoneNumber}
          onPhoneChange={setPhoneNumber}
          onLookup={handleLookup}
          isPending={lookupMutation.isPending}
          isDisabled={lookupButtonDisabled}
          summary={searchSummary}
        />

        {renderResults()}
      </ScrollView>
    </View>
  );
}
