import type { TextStyle } from "react-native";

import { fontSizes, fontWeights, letterSpacing, lineHeights } from "@theme/typography";

type ThemeValue = string | { val?: string } | undefined;

function resolveThemeColor(value: ThemeValue) {
  return typeof value === "string" ? value : (value?.val ?? "");
}

type BikeTheme = Record<string, ThemeValue>;

export function createBikeDetailTextStyles(theme: BikeTheme) {
  return {
    sectionTitle: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.md,
      fontWeight: fontWeights.bold,
      color: resolveThemeColor(theme.textPrimary),
    } satisfies TextStyle,
    cardTitle: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: fontWeights.bold,
      color: resolveThemeColor(theme.textPrimary),
      letterSpacing: letterSpacing.xxl,
    } satisfies TextStyle,
    cardSubtitle: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.medium,
      color: resolveThemeColor(theme.textSecondary),
    } satisfies TextStyle,
    ratingValue: {
      fontSize: fontSizes.ssm,
      lineHeight: lineHeights.ssm,
      fontWeight: fontWeights.bold,
      color: resolveThemeColor(theme.textPrimary),
    } satisfies TextStyle,
    ratingMeta: {
      fontSize: fontSizes.ssm,
      lineHeight: lineHeights.ssm,
      fontWeight: fontWeights.medium,
      color: resolveThemeColor(theme.textTertiary),
    } satisfies TextStyle,
    detailLabel: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.medium,
      color: resolveThemeColor(theme.textSecondary),
    } satisfies TextStyle,
    detailValue: {
      fontSize: 14.5,
      lineHeight: 21,
      fontWeight: fontWeights.bold,
      color: resolveThemeColor(theme.textPrimary),
      textAlign: "right",
    } satisfies TextStyle,
    optionTitle: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.bold,
      color: resolveThemeColor(theme.textPrimary),
    } satisfies TextStyle,
    optionTitleActive: {
      color: resolveThemeColor(theme.actionPrimary),
    } satisfies TextStyle,
    optionSubtitle: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight: fontWeights.medium,
      color: resolveThemeColor(theme.textTertiary),
    } satisfies TextStyle,
    optionSubtitleActive: {
      color: resolveThemeColor(theme.actionPrimary),
    } satisfies TextStyle,
    balanceLabel: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.medium,
      color: resolveThemeColor(theme.textSecondary),
    } satisfies TextStyle,
    balanceValue: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.md,
      fontWeight: fontWeights.bold,
      letterSpacing: -0.3,
      color: resolveThemeColor(theme.actionPrimary),
    } satisfies TextStyle,
    subscriptionTitle: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.bold,
      color: resolveThemeColor(theme.textPrimary),
    } satisfies TextStyle,
    subscriptionMeta: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.ssm,
      fontWeight: fontWeights.medium,
      color: resolveThemeColor(theme.textSecondary),
    } satisfies TextStyle,
    linkText: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.bold,
      color: resolveThemeColor(theme.actionPrimary),
    } satisfies TextStyle,
  };
}
