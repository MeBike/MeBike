import { IconSymbol } from "@components/IconSymbol";
import { BikeColors } from "@constants/BikeColors";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import BackendStatusIndicator from "./backend-status";

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
});

type LoginHeaderProps = {
  onBack: () => void;
  backendStatus: "checking" | "online" | "offline";
};

function LoginHeader({ onBack, backendStatus }: LoginHeaderProps) {
  return (
    <LinearGradient
      colors={[BikeColors.primary, BikeColors.secondary]}
      style={styles.header}
    >
      <Pressable style={styles.backButton} onPress={onBack}>
        <IconSymbol name="arrow.left" size={24} color="white" />
      </Pressable>

      <View style={styles.headerContent}>
        <IconSymbol name="bicycle" size={48} color="white" />
        <Text style={styles.headerTitle}>Đăng nhập</Text>
        <Text style={styles.headerSubtitle}>Chào mừng bạn trở lại!</Text>
        <BackendStatusIndicator backendStatus={backendStatus} />
      </View>
    </LinearGradient>
  );
}

export default LoginHeader;
