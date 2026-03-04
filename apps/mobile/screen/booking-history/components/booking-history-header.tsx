import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";

type BookingHistoryHeaderProps = {
  topInset: number;
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.88)",
  },
});

function BookingHistoryHeader({ topInset }: BookingHistoryHeaderProps) {
  return (
    <LinearGradient
      colors={["#0066FF", "#00B4D8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: topInset + 10 }]}
    >
      <Text style={styles.title}>Lịch sử chuyến đi</Text>
      <Text style={styles.subtitle}>Xem lại các lần thuê gần đây của bạn</Text>
    </LinearGradient>
  );
}

export default BookingHistoryHeader;
