import { shorthands } from "@tamagui/shorthands";
import { colors } from "@theme/colors";
import { radii, spacing } from "@theme/metrics";
import { fontSizes, fontWeights, letterSpacing, lineHeights } from "@theme/typography";
import { createFont, createTamagui, createTokens, isWeb } from "tamagui";

const appFont = createFont({
  family: isWeb ? "System" : "System",
  size: {
    1: fontSizes.xs,
    2: fontSizes.sm,
    3: fontSizes.md,
    4: fontSizes.lg,
    5: fontSizes.xl,
    6: fontSizes.xxl,
    7: fontSizes.xxxl,
    8: fontSizes.display,
  },
  lineHeight: {
    1: lineHeights.xs,
    2: lineHeights.sm,
    3: lineHeights.md,
    4: lineHeights.lg,
    5: lineHeights.xl,
    6: lineHeights.xxl,
    7: lineHeights.xxxl,
    8: lineHeights.display,
  },
  weight: {
    4: fontWeights.regular,
    5: fontWeights.medium,
    6: fontWeights.semibold,
    7: fontWeights.bold,
    8: fontWeights.heavy,
  },
  letterSpacing: {
    1: letterSpacing.xs,
    2: letterSpacing.sm,
    3: letterSpacing.md,
    4: letterSpacing.lg,
    5: letterSpacing.xl,
    6: letterSpacing.xxl,
    7: letterSpacing.xxxl,
    8: letterSpacing.display,
  },
});

const tokens = createTokens({
  color: {
    brandPrimary: colors.brandPrimary,
    brandSecondary: colors.brandSecondary,
    brandAccent: colors.brandAccent,
    background: colors.background,
    backgroundStrong: colors.backgroundStrong,
    surface: colors.surface,
    surfaceMuted: colors.surfaceMuted,
    surfaceAccent: colors.surfaceAccent,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    textOnBrand: colors.textOnBrand,
    borderSubtle: colors.borderSubtle,
    divider: colors.divider,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    shadowColor: colors.shadowColor,
  },
  space: {
    0: spacing.none,
    1: spacing.xs,
    2: spacing.sm,
    3: spacing.md,
    4: spacing.lg,
    true: spacing.lg,
    5: spacing.xl,
    6: spacing.xxl,
    7: spacing.xxxl,
  },
  size: {
    0: 0,
    1: 16,
    2: 20,
    3: 24,
    4: 32,
    true: 32,
    5: 40,
    6: 48,
    7: 56,
  },
  radius: {
    0: 0,
    1: radii.sm,
    2: radii.md,
    3: radii.lg,
    4: radii.xl,
    5: radii.xxl,
    round: radii.round,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
  },
});

export const appTamaguiConfig = createTamagui({
  defaultFont: "body",
  fonts: {
    body: appFont,
    heading: appFont,
  },
  tokens,
  themes: {
    light: {
      background: colors.background,
      backgroundStrong: colors.backgroundStrong,
      surface: colors.surface,
      surfaceMuted: colors.surfaceMuted,
      surfaceAccent: colors.surfaceAccent,
      color: colors.textPrimary,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      textMuted: colors.textMuted,
      textOnBrand: colors.textOnBrand,
      borderSubtle: colors.borderSubtle,
      divider: colors.divider,
      brandPrimary: colors.brandPrimary,
      brandSecondary: colors.brandSecondary,
      brandAccent: colors.brandAccent,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      shadowColor: colors.shadowColor,
    },
  },
  media: {
    short: { maxHeight: 780 },
    tall: { minHeight: 781 },
  },
  shorthands,
  settings: {
    disableSSR: true,
  },
});

export type AppTamaguiConfig = typeof appTamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default appTamaguiConfig;
