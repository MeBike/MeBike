import { radii, spaceScale } from "@theme/metrics";
import { fontSizes, fontWeights } from "@theme/typography";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "tamagui";

type AuthSegmentedTogglePalette = {
  surfaceMuted: string;
  borderSubtle: string;
  backgroundRaised: string;
  shadowColor: string;
  textPrimary: string;
  textSecondary: string;
};

function createAuthSegmentedToggleStyles(theme: AuthSegmentedTogglePalette) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      borderRadius: radii.lg,
      padding: spaceScale[1],
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    item: {
      flex: 1,
      borderRadius: radii.md,
      paddingVertical: spaceScale[2],
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    itemActive: {
      backgroundColor: theme.backgroundRaised,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    itemText: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: theme.textSecondary,
    },
    itemTextActive: {
      color: theme.textPrimary,
    },
  });
}

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
  const palette = useMemo(() => ({
    surfaceMuted: theme.surfaceMuted.val,
    borderSubtle: theme.borderSubtle.val,
    backgroundRaised: theme.backgroundRaised.val,
    shadowColor: theme.shadowColor.val,
    textPrimary: theme.textPrimary.val,
    textSecondary: theme.textSecondary.val,
  }), [
    theme.backgroundRaised.val,
    theme.borderSubtle.val,
    theme.shadowColor.val,
    theme.surfaceMuted.val,
    theme.textPrimary.val,
    theme.textSecondary.val,
  ]);
  const styles = useMemo(() => createAuthSegmentedToggleStyles(palette), [palette]);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.item, value === "login" ? styles.itemActive : null]}
        onPress={() => onChange("login")}
      >
        <Text style={[styles.itemText, value === "login" ? styles.itemTextActive : null]}>
          {loginLabel}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.item, value === "register" ? styles.itemActive : null]}
        onPress={() => onChange("register")}
      >
        <Text style={[styles.itemText, value === "register" ? styles.itemTextActive : null]}>
          {registerLabel}
        </Text>
      </Pressable>
    </View>
  );
}
