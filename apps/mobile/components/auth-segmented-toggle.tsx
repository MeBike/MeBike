import { BikeColors } from "@constants/BikeColors";
import { Pressable, StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    backgroundColor: BikeColors.lightGray,
    borderWidth: 1,
    borderColor: BikeColors.divider,
  },
  item: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  itemActive: {
    backgroundColor: BikeColors.background,
  },
  itemText: {
    fontSize: 13,
    fontWeight: "600",
    color: BikeColors.textSecondary,
  },
  itemTextActive: {
    color: BikeColors.textPrimary,
  },
});

export type AuthSegmentedToggleValue = "login" | "register";

type AuthSegmentedToggleProps = {
  value: AuthSegmentedToggleValue;
  onChange: (value: AuthSegmentedToggleValue) => void;
  loginLabel?: string;
  registerLabel?: string;
};

export function AuthSegmentedToggle({
  value,
  onChange,
  loginLabel = "Đăng nhập",
  registerLabel = "Đăng ký",
}: AuthSegmentedToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.item, value === "login" && styles.itemActive]}
        onPress={() => onChange("login")}
      >
        <Text style={[styles.itemText, value === "login" && styles.itemTextActive]}>
          {loginLabel}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.item, value === "register" && styles.itemActive]}
        onPress={() => onChange("register")}
      >
        <Text style={[styles.itemText, value === "register" && styles.itemTextActive]}>
          {registerLabel}
        </Text>
      </Pressable>
    </View>
  );
}
