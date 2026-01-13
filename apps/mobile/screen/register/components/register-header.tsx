import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "../../../components/IconSymbol";
import { BikeColors } from "../../../constants/BikeColors";

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
  },
  statusSpacer: {
    marginTop: 12,
    height: 16,
  },
});

type RegisterHeaderProps = {
  onBack: () => void;
};

function RegisterHeader({ onBack }: RegisterHeaderProps) {
  return (
    <LinearGradient
      colors={[BikeColors.primary, BikeColors.secondary]}
      style={styles.header}
    >
      <Pressable style={styles.backButton} onPress={onBack}>
        <IconSymbol name="arrow.left" size={24} color="white" />
      </Pressable>

      <View style={styles.headerContent}>
        <IconSymbol name="bicycle" size={44} color="white" />
        <Text style={styles.headerTitle}>Tạo tài khoản</Text>
        <Text style={styles.headerSubtitle}>Tham gia cộng đồng MeBike</Text>
        <View style={styles.statusSpacer} />
      </View>
    </LinearGradient>
  );
}

export default RegisterHeader;
