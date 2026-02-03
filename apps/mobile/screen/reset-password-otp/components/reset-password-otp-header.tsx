import { IconSymbol } from "@components/IconSymbol";
import { BikeColors } from "@constants/BikeColors";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  header: {
    paddingTop: 44,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 12,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 12,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
});

type ResetPasswordOtpHeaderProps = {
  onBack: () => void;
  email: string;
};

export function ResetPasswordOtpHeader({ onBack, email }: ResetPasswordOtpHeaderProps) {
  return (
    <LinearGradient colors={[BikeColors.primary, BikeColors.secondary]} style={styles.header}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <IconSymbol name="arrow.left" size={24} color="white" />
      </Pressable>

      <View style={styles.headerContent}>
        <IconSymbol name="key" size={44} color="white" />
        <Text style={styles.headerTitle}>Nhập mã OTP</Text>
        <Text style={styles.headerSubtitle}>
          Chúng tôi đã gửi mã OTP tới
          {"\n"}
          {email}
        </Text>
      </View>
    </LinearGradient>
  );
}
