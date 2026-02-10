import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "../../../components/IconSymbol";
import { BikeColors } from "../../../constants/BikeColors";

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: BikeColors.secondary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: BikeColors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});

type EmailVerificationHeaderProps = {
  email: string;
};

export function EmailVerificationHeader({ email }: EmailVerificationHeaderProps) {
  return (
    <LinearGradient
      colors={[`${BikeColors.secondary}10`, "white"]}
      style={styles.header}
    >
      <View style={styles.logoContainer}>
        <IconSymbol
          name="envelope.open"
          size={60}
          color={BikeColors.secondary}
        />
        <Text style={styles.logoText}>Xác nhận Email</Text>
        <Text style={styles.subtitle}>
          Chúng tôi đã gửi mã OTP đến
          {" "}
          {"\n"}
          {email}
        </Text>
      </View>
    </LinearGradient>
  );
}
