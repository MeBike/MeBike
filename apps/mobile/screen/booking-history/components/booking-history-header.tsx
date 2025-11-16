import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";

type BookingHistoryHeaderProps = {
  topInset: number;
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
});

function BookingHistoryHeader({ topInset }: BookingHistoryHeaderProps) {
  return (
    <LinearGradient
      colors={["#0066FF", "#00B4D8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: topInset + 16 }]}
    >
      <Text style={styles.title}>Lịch sử thuê xe</Text>
      <Text style={styles.subtitle}>Xem tất cả các lần thuê xe của bạn</Text>
    </LinearGradient>
  );
}

export default BookingHistoryHeader;
