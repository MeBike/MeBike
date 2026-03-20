export const fontFamily = "System";

export const fontSizes = {
  xs: 12,
  ssm: 13,
  sm: 14,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
} as const;

export const lineHeights = {
  xs: 16,
  ssm: 18,
  sm: 20,
  base: 22,
  md: 24,
  lg: 26,
  xl: 28,
  xxl: 32,
  xxxl: 36,
  display: 40,
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
} as const;

export const letterSpacing = {
  xs: 0,
  sm: 0,
  md: 0,
  lg: 0,
  xl: -0.2,
  xxl: -0.4,
  xxxl: -0.6,
  display: -0.8,
} as const;

export const textStyles = {
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
  },
  hero: {
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: fontWeights.heavy,
  },
} as const;
