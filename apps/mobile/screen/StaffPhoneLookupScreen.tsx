import { Ionicons } from "@expo/vector-icons";
import type { AxiosError } from "axios";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import BookingDetailHeader from "@components/booking-history-detail/components/BookingDetailHeader";
import { useStaffActiveRentalsByPhone } from "@hooks/query/Rent/useStaffActiveRentalsByPhone";
import { useStationActions } from "@hooks/useStationAction";
import type { StaffActiveRental } from "@/types/RentalTypes";
import { formatVietnamDateTime } from "@utils/date";
import { RootStackParamList } from "../types/navigation";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return formatVietnamDateTime(value);
};

const shortenId = (value: string) => {
  if (!value) return "-";
  return value.length > 8 ? `...${value.slice(-6)}` : value;
};

const formatDuration = (minutes?: number) => {
  if (!minutes || minutes <= 0) return "Chưa xác định";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}p` : `${hours}h`;
  }
  return `${mins} phút`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ĐANG THUÊ":
      return "#FF9800";
    case "HOÀN THÀNH":
      return "#4CAF50";
    case "ĐÃ HỦY":
      return "#F44336";
    default:
      return "#999";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "ĐANG THUÊ":
      return "Đang thuê";
    case "HOÀN THÀNH":
      return "Hoàn thành";
    case "ĐÃ HỦY":
      return "Đã hủy";
    default:
      return status;
  }
};

function StaffPhoneLookupScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchResults, setSearchResults] = useState<StaffActiveRental[]>([]);
  const [lastSearchedPhone, setLastSearchedPhone] = useState<string | null>(
    null
  );
  const lookupMutation = useStaffActiveRentalsByPhone();
  const {
    stations: stationData,
    isLoadingGetAllStations,
  } = useStationActions(true);

  const stationNameMap = useMemo(() => {
    if (!stationData) return new Map<string, string>();
    return new Map<string, string>(
      stationData.map((station) => [station._id, station.name])
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
          setSearchResults(response.data.data ?? []);
          setLastSearchedPhone(normalized);
        },
        onError: (error: AxiosError<{ message?: string }>) => {
          const message =
            error?.response?.data?.message ||
            "Không thể tra cứu khách bằng số điện thoại.";
          Alert.alert("Lỗi tra cứu", message);
          setSearchResults([]);
          setLastSearchedPhone(normalized);
        },
      }
    );
  };

  const lookupButtonDisabled =
    lookupMutation.isPending || phoneNumber.trim().length === 0;

  const searchSummary = useMemo(() => {
    if (!lastSearchedPhone) return null;
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
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#CBD5F5" />
          <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
          <Text style={styles.emptySubtitle}>
            Nhập số điện thoại của khách để kiểm tra phiên thuê đang hoạt động.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        {searchResults.map((rental) => {
          const stationName =
            stationNameMap.get(rental.start_station) ?? rental.start_station;
          return (
            <TouchableOpacity
              key={rental._id}
              style={styles.resultCard}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("StaffRentalDetail", {
                  rentalId: rental._id,
                })
              }
            >
            <View style={styles.resultHeader}>
              <View style={styles.resultTitleWrapper}>
                <Text
                  style={styles.resultTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {rental.user?.fullname || "Khách hàng"}
                </Text>
                <Text style={styles.resultSubTitle}>
                  Mã thuê: {shortenId(rental._id)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(rental.status) },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {getStatusText(rental.status)}
                </Text>
              </View>
            </View>

            <View style={styles.resultBody}>
              <View style={styles.resultRow}>
                <Ionicons name="bicycle" size={18} color="#2563EB" />
                <Text style={styles.resultRowText}>
                  Xe: {shortenId(rental.bike_id)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Ionicons name="time" size={16} color="#64748B" />
                <Text style={styles.resultRowText}>
                  Bắt đầu: {formatDate(rental.start_time)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Ionicons name="hourglass" size={16} color="#64748B" />
                <Text style={styles.resultRowText}>
                  Thời lượng: {formatDuration(rental.duration)}
                </Text>
              </View>
              {rental.start_station && (
                <View style={styles.resultRow}>
                  <Ionicons name="navigate" size={16} color="#64748B" />
                  <Text
                    style={styles.resultRowText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Trạm xuất phát: {stationName}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.footerHint}>Chạm để quản lý phiên thuê</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
        refreshControl={
          <RefreshControl
            refreshing={lookupMutation.isPending}
            onRefresh={handleLookup}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lookupCard}>
          <Text style={styles.lookupTitle}>Tìm kiếm khách hàng</Text>
          <Text style={styles.lookupDescription}>
            Nhập số điện thoại khách hàng để lấy danh sách phiên thuê đang hoạt
            động trong trường hợp họ không thể quét mã QR.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: 0912345678"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={15}
          />
          <TouchableOpacity
            style={[
              styles.lookupButton,
              lookupButtonDisabled && styles.lookupButtonDisabled,
            ]}
            disabled={lookupButtonDisabled}
            onPress={handleLookup}
          >
            {lookupMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.lookupButtonText}>Tra cứu</Text>
              </>
            )}
          </TouchableOpacity>
          {searchSummary && (
            <Text style={styles.lookupSummary}>{searchSummary}</Text>
          )}
        </View>

        {renderResults()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  lookupCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lookupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  lookupDescription: {
    marginTop: 8,
    color: "#4B5563",
    lineHeight: 20,
  },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  lookupButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0066FF",
    paddingVertical: 14,
    borderRadius: 12,
  },
  lookupButtonDisabled: {
    opacity: 0.6,
  },
  lookupButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  lookupSummary: {
    marginTop: 12,
    color: "#4B5563",
  },
  resultsContainer: {
    marginTop: 16,
    gap: 16,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 4,
    borderLeftColor: "#0066FF",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  resultTitleWrapper: {
    flex: 1,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  resultSubTitle: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  resultBody: {
    gap: 8,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultRowText: {
    color: "#374151",
    fontSize: 14,
    flex: 1,
  },
  cardFooter: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerHint: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  emptySubtitle: {
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default StaffPhoneLookupScreen;
