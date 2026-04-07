import type { ReactNode } from "react";

import { IconSymbol } from "@components/IconSymbol";
import { radii, spacingRules } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

type AuthHeaderVariant = "brand" | "soft";

type AuthHeaderProps = {
  title: string;
  subtitle: ReactNode;
  onBack?: () => void;
  accessory?: ReactNode;
  variant?: AuthHeaderVariant;
  size?: "default" | "compact";
};

export function AuthHeader({
  title,
  subtitle,
  onBack,
  accessory,
  variant = "brand",
  size = "default",
}: AuthHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const compact = size === "compact";

  const gradient = variant === "brand"
    ? [theme.actionPrimary.val, theme.actionSecondary.val] as const
    : [theme.surfaceAccent.val, theme.backgroundRaised.val] as const;

  const titleTone = variant === "brand" ? "inverted" : "default";
  const subtitleTone = variant === "brand" ? "inverted" : "muted";
  const iconColor = variant === "brand" ? theme.onSurfaceBrand.val : theme.textPrimary.val;
  const backBackground = variant === "brand" ? theme.overlayGlass.val : theme.surfaceDefault.val;

  return (
    <LinearGradient
      colors={gradient}
      style={{
        paddingTop: insets.top + spacingRules.control.paddingY,
        paddingHorizontal: spacingRules.card.paddingDefault,
        paddingBottom: spacingRules.page.sectionGap,
        borderBottomLeftRadius: radii.xl,
        borderBottomRightRadius: radii.xl,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacingRules.list.rowGap,
        }}
      >
        {onBack
          ? (
              <Pressable
                onPress={onBack}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: backBackground,
                }}
              >
                <IconSymbol color={iconColor} name="arrow-left" size="lg" />
              </Pressable>
            )
          : null}
      </View>

      <View style={{ gap: spacingRules.hero.contentGap }}>
        <AppText style={{ maxWidth: 320 }} tone={titleTone} variant="title">
          {title}
        </AppText>
        <AppText style={{ maxWidth: 320 }} tone={subtitleTone} variant={compact ? "bodySmall" : "bodySmall"}>
          {subtitle}
        </AppText>
        {accessory
          ? <View style={{ marginTop: spacingRules.control.compactGap }}>{accessory}</View>
          : null}
      </View>
    </LinearGradient>
  );
}
