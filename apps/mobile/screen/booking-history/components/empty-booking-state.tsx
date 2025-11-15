import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

function EmptyBookingState() {
  return (
    <View style={styles.container}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.title}>Chưa có lịch sử thuê xe</Text>
      <Text style={styles.subtitle}>
        Khi bạn thuê xe, lịch sử sẽ hiển thị ở đây
      </Text>
    </View>
  );
}

export default EmptyBookingState;
