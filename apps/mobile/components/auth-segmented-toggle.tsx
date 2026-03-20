import { colors } from "@theme/colors";
import { radii, spacing } from "@theme/metrics";
import { fontSizes, fontWeights } from "@theme/typography";
import { Pressable, StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: radii.lg,
    padding: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  item: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  itemActive: {
    backgroundColor: colors.backgroundStrong,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  itemText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  itemTextActive: {
    color: colors.textPrimary,
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
