import { textStyles } from "@theme/typography";
import { styled, Text } from "tamagui";

export const AppText = styled(Text, {
  color: "$textPrimary",
  fontFamily: "$body",
  fontSize: textStyles.body.fontSize,
  lineHeight: textStyles.body.lineHeight,
  fontWeight: textStyles.body.fontWeight,
  variants: {
    variant: {
      caption: textStyles.caption,
      meta: textStyles.meta,
      eyebrow: textStyles.eyebrow,
      fieldLabel: textStyles.fieldLabel,
      label: textStyles.label,
      bodySmall: textStyles.bodySmall,
      body: textStyles.body,
      bodyStrong: textStyles.bodyStrong,
      compactStrong: textStyles.compactStrong,
      subhead: textStyles.subhead,
      actionLabel: textStyles.actionLabel,
      value: textStyles.value,
      sectionTitle: textStyles.sectionTitle,
      cardTitle: textStyles.cardTitle,
      tabLabel: textStyles.tabLabel,
      headline: textStyles.headline,
      metricValue: textStyles.metricValue,
      priceValue: textStyles.priceValue,
      badgeLabel: textStyles.badgeLabel,
      xlTitle: textStyles.xlTitle,
      title: textStyles.title,
      hero: textStyles.hero,
    },
    tone: {
      default: {
        color: "$textPrimary",
      },
      muted: {
        color: "$textSecondary",
      },
      subtle: {
        color: "$textMuted",
      },
      brand: {
        color: "$brandPrimary",
      },
      inverted: {
        color: "$textOnBrand",
      },
      success: {
        color: "$success",
      },
      warning: {
        color: "$warning",
      },
      danger: {
        color: "$error",
      },
    },
    align: {
      left: { textAlign: "left" },
      center: { textAlign: "center" },
      right: { textAlign: "right" },
    },
  } as const,
  defaultVariants: {
    variant: "body",
    tone: "default",
  },
});
