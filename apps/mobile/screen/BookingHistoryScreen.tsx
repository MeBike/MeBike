

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { RentingHistory } from "../types/RentalTypes";
import { useRentalsActions } from "@hooks/useRentalAction";

const BookingHistoryScreen = () => {
  const { rentalsData, isGetAllRentalsFetching, getAllRentals } = useRentalsActions(true);
  const [bookings, setBookings] = useState<RentingHistory[]>([]);

  useEffect(() => {
    // Gọi getAllRentals để fetch data khi component mount
    getAllRentals();
  }, [getAllRentals]);

  useEffect(() => {
    if (rentalsData && !isGetAllRentalsFetching) {
      if (rentalsData.data?.data && Array.isArray(rentalsData.data.data)) {
        setBookings(rentalsData.data.data);
      }
    }
  }, [rentalsData, isGetAllRentalsFetching]);

  useEffect(() => {
    console.log('bookings state:', bookings);
  }, [bookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HOÀN THÀNH":
        return "#4CAF50";
      case "ĐANG THUÊ":
        return "#FF9800";
      case "ĐÃ HỦY":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "HOÀN THÀNH":
        return "Hoàn thành";
      case "ĐANG THUÊ":
        return "Đang thuê";
      case "ĐÃ HỦY":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN") + " - " + date.toLocaleTimeString("vi-VN", {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration: number) => {
    if (duration === 0) return "Chưa kết thúc";
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    if (hours > 0) {
      return `${hours} giờ ${minutes > 0 ? minutes + ' phút' : ''}`;
    }
    return `${minutes} phút`;
  };

  const renderBookingCard = ({ item }: { item: RentingHistory }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.bikeInfo}>
          <Ionicons name="bicycle" size={24} color="#0066FF" />
          <View style={styles.bikeDetails}>
            <Text style={styles.bikeType}>Xe đạp</Text>
            <Text style={styles.location}>ID: {item.start_station}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDate(item.start_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={16} color="#0066FF" />
          <Text style={[styles.detailText, styles.priceText]}>
            {item.total_price.toLocaleString("vi-VN")} đ
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.detailButton}>
        <Text style={styles.detailButtonText}>Xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={16} color="#0066FF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />

      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Lịch sử thuê xe</Text>
        <Text style={styles.headerSubtitle}>
          Xem tất cả các lần thuê xe của bạn
        </Text>
      </LinearGradient>

      {isGetAllRentalsFetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có lịch sử thuê xe</Text>
          <Text style={styles.emptySubtext}>
            Khi bạn thuê xe, lịch sử sẽ hiển thị ở đây
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bikeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  bikeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  bikeType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  priceText: {
    fontWeight: "600",
    color: "#0066FF",
    fontSize: 14,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailButtonText: {
    color: "#0066FF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

export default BookingHistoryScreen;
