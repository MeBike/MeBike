import { textStyles, typographyTokens } from "@theme/typography";
import { styled, Text } from "tamagui";

export type AppTextTone
  = | "default"
    | "muted"
    | "subtle"
    | "disabled"
    | "brand"
    | "inverted"
    | "success"
    | "warning"
    | "danger";

export const AppText = styled(Text, {
  name: "AppText",
  color: "$textPrimary",
  fontFamily: "$body",
  fontSize: typographyTokens.body,
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
        color: "$textTertiary",
      },
      disabled: {
        color: "$textDisabled",
      },
      brand: {
        color: "$textBrand",
      },
      inverted: {
        color: "$textInverse",
      },
      success: {
        color: "$textSuccess",
      },
      warning: {
        color: "$textWarning",
      },
      danger: {
        color: "$textDanger",
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
