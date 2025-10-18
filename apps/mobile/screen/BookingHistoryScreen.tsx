

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface Booking {
  id: string;
  bikeType: string;
  location: string;
  startDate: string;
  duration: string;
  price: number;
  status: "completed" | "ongoing" | "cancelled";
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    bikeType: "Xe đạp thường",
    location: "Quận 1, TP.HCM",
    startDate: "15/10/2025 - 14:30",
    duration: "2 giờ",
    price: 50000,
    status: "completed",
  },
  {
    id: "2",
    bikeType: "Xe đạp điện",
    location: "Quận 3, TP.HCM",
    startDate: "14/10/2025 - 09:00",
    duration: "3 giờ",
    price: 120000,
    status: "completed",
  },
  {
    id: "3",
    bikeType: "Xe đạp thường",
    location: "Quận 7, TP.HCM",
    startDate: "12/10/2025 - 16:45",
    duration: "1.5 giờ",
    price: 35000,
    status: "completed",
  },
  {
    id: "4",
    bikeType: "Xe đạp leo núi",
    location: "Quận 2, TP.HCM",
    startDate: "10/10/2025 - 10:00",
    duration: "4 giờ",
    price: 180000,
    status: "completed",
  },
];

const BookingHistoryScreen = () => {
  const [bookings] = useState<Booking[]>(MOCK_BOOKINGS);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "ongoing":
        return "#FF9800";
      case "cancelled":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "ongoing":
        return "Đang thuê";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.bikeInfo}>
          <Ionicons name="bicycle" size={24} color="#0066FF" />
          <View style={styles.bikeDetails}>
            <Text style={styles.bikeType}>{item.bikeType}</Text>
            <Text style={styles.location}>{item.location}</Text>
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
          <Text style={styles.detailText}>{item.startDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>{item.duration}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={16} color="#0066FF" />
          <Text style={[styles.detailText, styles.priceText]}>
            {item.price.toLocaleString("vi-VN")} đ
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

      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
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
});

export default BookingHistoryScreen;
