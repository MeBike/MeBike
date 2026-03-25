import type { ReactNode } from "react";

import { IconSymbol } from "@components/IconSymbol";
import { colors, gradients } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

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
    bottomPadding: spacing.xxxxl,
    titleVariant: "title",
  },
  compact: {
    bottomPadding: spacing.xxxl,
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
  const sizeStyle = sizeStyles[size];
  const bottomPadding = footer ? spacing.xl : sizeStyle.bottomPadding;

  return (
    <LinearGradient
      colors={gradients.brandHero}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: bottomPadding,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
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
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.overlayLight,
                  }}
                >
                  <IconSymbol name="arrow.left" size={20} color={colors.textOnBrand} />
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
