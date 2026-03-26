import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "tamagui";

import { radii, spaceScale } from "@theme/metrics";
import { fontSizes, fontWeights } from "@theme/typography";

const styles = StyleSheet.create({
  itemText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
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
  const theme = useTheme();

  return (
    <View style={{
      flexDirection: "row",
      borderRadius: radii.lg,
      padding: spaceScale[1],
      backgroundColor: theme.surfaceMuted.val,
      borderWidth: 1,
      borderColor: theme.borderSubtle.val,
    }}
    >
      <Pressable
        style={[
          {
            flex: 1,
            borderRadius: radii.md,
            paddingVertical: spaceScale[2],
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          },
          value === "login"
            ? {
                backgroundColor: theme.backgroundRaised.val,
                shadowColor: theme.shadowColor.val,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 2,
              }
            : null,
        ]}
        onPress={() => onChange("login")}
      >
        <Text style={[styles.itemText, { color: value === "login" ? theme.textPrimary.val : theme.textSecondary.val }]}>
          {loginLabel}
        </Text>
      </Pressable>
      <Pressable
        style={[
          {
            flex: 1,
            borderRadius: radii.md,
            paddingVertical: spaceScale[2],
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          },
          value === "register"
            ? {
                backgroundColor: theme.backgroundRaised.val,
                shadowColor: theme.shadowColor.val,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 2,
              }
            : null,
        ]}
        onPress={() => onChange("register")}
      >
        <Text style={[styles.itemText, { color: value === "register" ? theme.textPrimary.val : theme.textSecondary.val }]}>
          {registerLabel}
        </Text>
      </Pressable>
    </View>
  );
}
