import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
});

type VerifyEmailModalHeaderProps = {
  onClose: () => void;
};

function VerifyEmailModalHeader({ onClose }: VerifyEmailModalHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Xác thực Email</Text>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

export default VerifyEmailModalHeader;
