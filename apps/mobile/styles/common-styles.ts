import { colors } from "@theme/colors";
import { radii, spacing as themeSpacing } from "@theme/metrics";
import { textStyles } from "@theme/typography";
import { StyleSheet } from "react-native";

export const commonColors = {
  primary: colors.brandPrimary,
  background: colors.backgroundStrong,
  surface: colors.surface,
  text: colors.textPrimary,
  textSecondary: colors.textSecondary,
  accent: colors.brandAccent,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  divider: colors.divider,
  shadow: colors.shadowColor,
};

export const spacing = {
  xs: themeSpacing.xs,
  sm: themeSpacing.sm,
  md: themeSpacing.lg,
  lg: themeSpacing.xxl,
  xl: themeSpacing.xxxl,
  xxl: themeSpacing.xxxxl,
};

export const borderRadius = {
  sm: radii.sm,
  md: radii.md,
  lg: radii.lg,
  xl: radii.xl,
  full: radii.round,
};

export const typography = {
  h1: textStyles.hero,
  h2: textStyles.title,
  h3: textStyles.sectionTitle,
  body: textStyles.body,
  bodySmall: textStyles.bodySmall,
  meta: textStyles.meta,
  caption: textStyles.caption,
  eyebrow: textStyles.eyebrow,
};

export const shadows = {
  small: {
    shadowColor: commonColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: commonColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: commonColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: commonColors.background,
  },
  surface: {
    backgroundColor: commonColors.surface,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    justifyContent: "space-between",
  },
  textPrimary: {
    color: commonColors.text,
  },
  textSecondary: {
    color: commonColors.textSecondary,
  },
  textAccent: {
    color: commonColors.accent,
  },
});
