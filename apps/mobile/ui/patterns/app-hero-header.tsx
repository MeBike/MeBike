import type { ReactNode } from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";
import { radii, spacingRules } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

type AppHeroHeaderSize = "default" | "compact";
type AppHeroHeaderVariant = "brand" | "gradient" | "surface";

type AppHeroHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  accessory?: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  size?: AppHeroHeaderSize;
  titleVariant?: "sectionTitle" | "title" | "xlTitle";
  variant?: AppHeroHeaderVariant;
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
  titleVariant,
  variant = "gradient",
}: AppHeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const sizeStyle = sizeStyles[size];
  const isSurface = variant === "surface";
  const bottomPadding = footer
    ? spacingRules.page.sectionGap
    : isSurface
      ? spacingRules.control.paddingY
      : sizeStyle.bottomPadding;
  const resolvedTitleVariant = titleVariant ?? sizeStyle.titleVariant;

  const headerContent = (
    <>
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
                    backgroundColor: isSurface ? "transparent" : theme.overlayGlass.val,
                  }}
                >
                  <IconSymbol
                    name="arrow-left"
                    size="md"
                    color={isSurface ? theme.textSecondary.val : theme.onSurfaceBrand.val}
                  />
                </Pressable>
              )
            : null}

          <YStack flex={1} gap="$1">
            <AppText
              selectable
              numberOfLines={1}
              tone={isSurface ? "default" : "inverted"}
              variant={resolvedTitleVariant}
            >
              {title}
            </AppText>
            {typeof subtitle === "string"
              ? (
                  <AppText
                    selectable
                    opacity={isSurface ? 1 : 0.9}
                    tone={isSurface ? "muted" : "inverted"}
                    variant="bodySmall"
                  >
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
    </>
  );

  if (isSurface) {
    return (
      <YStack
        backgroundColor="$surfaceDefault"
        borderBottomColor="$borderSubtle"
        borderBottomLeftRadius={footer ? radii.xxl : 0}
        borderBottomRightRadius={footer ? radii.xxl : 0}
        borderBottomWidth={1}
        paddingTop={insets.top + spacingRules.hero.paddingTop}
        paddingHorizontal={spacingRules.hero.paddingX}
        paddingBottom={bottomPadding}
      >
        {headerContent}
      </YStack>
    );
  }

  if (variant === "brand") {
    return (
      <YStack
        backgroundColor="$actionPrimary"
        borderBottomLeftRadius={radii.xxl}
        borderBottomRightRadius={radii.xxl}
        paddingTop={insets.top + spacingRules.hero.paddingTop}
        paddingHorizontal={spacingRules.hero.paddingX}
        paddingBottom={bottomPadding}
      >
        {headerContent}
      </YStack>
    );
  }

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
      {headerContent}
    </LinearGradient>
  );
}
