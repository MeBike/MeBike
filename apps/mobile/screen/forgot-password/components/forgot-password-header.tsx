import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "../../../components/IconSymbol";
import { BikeColors } from "../../../constants/BikeColors";

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: "relative",
  },
  backButton: {
    padding: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
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
    textAlign: "center",
  },
});

type ForgotPasswordHeaderProps = {
  onBack: () => void;
};

export function ForgotPasswordHeader({ onBack }: ForgotPasswordHeaderProps) {
  return (
    <LinearGradient
      colors={[BikeColors.primary, BikeColors.secondary]}
      style={styles.header}
    >
      <Pressable style={styles.backButton} onPress={onBack}>
        <IconSymbol name="chevron.left" size={24} color="white" />
      </Pressable>

      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <Text style={styles.headerSubtitle}>
          Vui lòng nhập email để nhận mã OTP
        </Text>
      </View>
    </LinearGradient>
  );
}
