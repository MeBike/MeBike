import type { ReactNode } from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";
import { radii, spacingRules } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

type AppHeroHeaderSize = "default" | "compact";

type AppHeroHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  accessory?: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  size?: AppHeroHeaderSize;
};

const sizeStyles: Record<AppHeroHeaderSize, {
  bottomPadding: number;
  titleVariant: "title" | "xlTitle";
}> = {
  default: {
    bottomPadding: spacingRules.hero.paddingBottomDefault,
    titleVariant: "title",
  },
  compact: {
    bottomPadding: spacingRules.hero.paddingBottomCompact,
    titleVariant: "xlTitle",
  },
};

export function AppHeroHeader({
  title,
  subtitle,
  accessory,
  footer,
  onBack,
  size = "default",
}: AppHeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const sizeStyle = sizeStyles[size];
  const bottomPadding = footer ? spacingRules.page.sectionGap : sizeStyle.bottomPadding;

  return (
    <LinearGradient
      colors={[theme.actionPrimary.val, theme.actionSecondary.val]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{
        paddingTop: insets.top + spacingRules.hero.paddingTop,
        paddingHorizontal: spacingRules.hero.paddingX,
        paddingBottom: bottomPadding,
        borderBottomLeftRadius: radii.xxl,
        borderBottomRightRadius: radii.xxl,
      }}
    >
      <XStack alignItems="center" gap="$3" justifyContent="space-between">
        <XStack alignItems="center" flex={1} gap="$3" paddingRight={accessory ? "$2" : "$0"}>
          {onBack
            ? (
                <Pressable
                  onPress={onBack}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radii.round,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.overlayGlass.val,
                  }}
                >
                  <IconSymbol name="arrow.left" size={20} color={theme.onSurfaceBrand.val} />
                </Pressable>
              )
            : null}

          <YStack flex={1} gap="$1">
            <AppText selectable numberOfLines={1} tone="inverted" variant={sizeStyle.titleVariant}>
              {title}
            </AppText>
            {typeof subtitle === "string"
              ? (
                  <AppText selectable opacity={0.9} tone="inverted" variant="bodySmall">
                    {subtitle}
                  </AppText>
                )
              : subtitle ?? null}
          </YStack>
        </XStack>

        {accessory ?? null}
      </XStack>

      {footer
        ? (
            <YStack paddingTop="$5">
              {footer}
            </YStack>
          )
        : null}
    </LinearGradient>
  );
}
