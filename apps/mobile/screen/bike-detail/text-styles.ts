import type { TextStyle } from "react-native";

import { colors } from "@theme/colors";

export const bikeDetailTextStyles = {
  sectionTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  } satisfies TextStyle,
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textSecondary,
  } satisfies TextStyle,
  ratingValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  } satisfies TextStyle,
  ratingMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.textMuted,
  } satisfies TextStyle,
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textSecondary,
  } satisfies TextStyle,
  detailValue: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "right",
  } satisfies TextStyle,
  optionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  } satisfies TextStyle,
  optionTitleActive: {
    color: colors.brandPrimary,
  } satisfies TextStyle,
  optionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    color: colors.textMuted,
  } satisfies TextStyle,
  optionSubtitleActive: {
    color: colors.brandPrimary,
  } satisfies TextStyle,
  balanceLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textSecondary,
  } satisfies TextStyle,
  balanceValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: colors.brandPrimary,
  } satisfies TextStyle,
  subscriptionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  } satisfies TextStyle,
  subscriptionMeta: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.textSecondary,
  } satisfies TextStyle,
  linkText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.brandPrimary,
  } satisfies TextStyle,
};
