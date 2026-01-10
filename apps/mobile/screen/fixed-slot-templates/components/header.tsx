import { BikeColors } from "@constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
  },
});

type FixedSlotTemplatesHeaderProps = {
  topInset: number;
  title: string;
  subtitle?: string;
  onBack: () => void;
};

export function FixedSlotTemplatesHeader({
  topInset,
  title,
  subtitle = "Quản lý các khung giờ giữ xe",
  onBack,
}: FixedSlotTemplatesHeaderProps) {
  return (
    <LinearGradient
      colors={[BikeColors.primary, BikeColors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: topInset + 16 }]}
    >
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );
}
