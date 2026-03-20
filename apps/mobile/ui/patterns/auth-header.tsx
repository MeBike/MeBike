import type { ReactNode } from "react";

import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { iconSizes, spacing } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthHeaderVariant = "brand" | "soft";

type AuthHeaderProps = {
  title: string;
  subtitle: ReactNode;
  onBack?: () => void;
  accessory?: ReactNode;
  variant?: AuthHeaderVariant;
  size?: "default" | "compact";
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  content: {
    gap: spacing.xs,
  },
  title: {
    maxWidth: 320,
  },
  titleCompact: {
    maxWidth: 320,
  },
  subtitle: {
    maxWidth: 320,
  },
  subtitleCompact: {
    maxWidth: 320,
  },
  accessory: {
    marginTop: spacing.sm,
  },
});

export function AuthHeader({
  title,
  subtitle,
  onBack,
  accessory,
  variant = "brand",
  size = "default",
}: AuthHeaderProps) {
  const insets = useSafeAreaInsets();
  const gradient = variant === "brand"
    ? (["#2563EB", "#38BDF8"] as const)
    : (["#3B82F6", "#7DD3FC"] as const);
  const titleTone = "inverted";
  const subtitleTone = "inverted";
  const backColor = colors.textOnBrand;
  const compact = size === "compact";

  return (
    <LinearGradient colors={gradient} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        {onBack
          ? (
              <Pressable onPress={onBack} style={[styles.backButton, { backgroundColor: "rgba(255, 255, 255, 0.16)" }]}>
                <IconSymbol color={backColor} name="arrow.left" size={iconSizes.lg} />
              </Pressable>
            )
          : null}
      </View>

      <View style={styles.content}>
        <AppText style={compact ? styles.titleCompact : styles.title} tone={titleTone} variant="title">
          {title}
        </AppText>
        <AppText style={compact ? styles.subtitleCompact : styles.subtitle} tone={subtitleTone} variant={compact ? "bodySmall" : "bodySmall"}>
          {subtitle}
        </AppText>
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
      </View>
    </LinearGradient>
  );
}
