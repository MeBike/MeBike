import type { TextStyle } from "react-native";

import { colors } from "@theme/colors";
import { fontSizes, fontWeights, letterSpacing, lineHeights } from "@theme/typography";

export const bikeDetailTextStyles = {
  sectionTitle: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  } satisfies TextStyle,
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    letterSpacing: letterSpacing.xxl,
  } satisfies TextStyle,
  cardSubtitle: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  } satisfies TextStyle,
  ratingValue: {
    fontSize: fontSizes.ssm,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  } satisfies TextStyle,
  ratingMeta: {
    fontSize: fontSizes.ssm,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  } satisfies TextStyle,
  detailLabel: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  } satisfies TextStyle,
  detailValue: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: "right",
  } satisfies TextStyle,
  optionTitle: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  } satisfies TextStyle,
  optionTitleActive: {
    color: colors.brandPrimary,
  } satisfies TextStyle,
  optionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  } satisfies TextStyle,
  optionSubtitleActive: {
    color: colors.brandPrimary,
  } satisfies TextStyle,
  balanceLabel: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  } satisfies TextStyle,
  balanceValue: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.heavy,
    letterSpacing: -0.3,
    color: colors.brandPrimary,
  } satisfies TextStyle,
  subscriptionTitle: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  } satisfies TextStyle,
  subscriptionMeta: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  } satisfies TextStyle,
  linkText: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.bold,
    color: colors.brandPrimary,
  } satisfies TextStyle,
};
