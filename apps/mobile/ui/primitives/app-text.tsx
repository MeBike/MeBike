import { fontSizes, fontWeights, lineHeights } from "@theme/typography";
import { styled, Text } from "tamagui";

export const AppText = styled(Text, {
  color: "$textPrimary",
  fontFamily: "$body",
  fontSize: fontSizes.md,
  lineHeight: lineHeights.md,
  variants: {
    variant: {
      caption: {
        fontSize: fontSizes.xs,
        lineHeight: lineHeights.xs,
        fontWeight: fontWeights.medium,
      },
      fieldLabel: {
        fontSize: fontSizes.ssm,
        lineHeight: lineHeights.ssm,
        fontWeight: fontWeights.bold,
      },
      label: {
        fontSize: fontSizes.sm,
        lineHeight: lineHeights.sm,
        fontWeight: fontWeights.semibold,
      },
      bodySmall: {
        fontSize: fontSizes.base,
        lineHeight: lineHeights.base,
        fontWeight: fontWeights.medium,
      },
      body: {
        fontSize: fontSizes.md,
        lineHeight: lineHeights.md,
        fontWeight: fontWeights.regular,
      },
      bodyStrong: {
        fontSize: fontSizes.md,
        lineHeight: lineHeights.md,
        fontWeight: fontWeights.semibold,
      },
      title: {
        fontSize: fontSizes.xxl,
        lineHeight: lineHeights.xxl,
        fontWeight: fontWeights.bold,
        letterSpacing: -0.4,
      },
      xlTitle: {
        fontSize: fontSizes.xl,
        lineHeight: lineHeights.xl,
        fontWeight: fontWeights.bold,
        letterSpacing: -0.2,
      },
      hero: {
        fontSize: fontSizes.display,
        lineHeight: lineHeights.display,
        fontWeight: fontWeights.heavy,
        letterSpacing: -0.6,
      },
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
