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

type AppTextStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: (typeof fontWeights)[keyof typeof fontWeights];
  letterSpacing?: number;
  textTransform?: "uppercase";
};

function defineTextStyle(style: AppTextStyle) {
  return style;
}

export const textStyles = {
  caption: defineTextStyle({
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
  }),
  meta: defineTextStyle({
    fontSize: fontSizes.ssm,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.medium,
  }),
  eyebrow: defineTextStyle({
    fontSize: fontSizes.ssm,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.heavy,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  }),
  fieldLabel: defineTextStyle({
    fontSize: fontSizes.ssm,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.bold,
  }),
  label: defineTextStyle({
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
  }),
  bodySmall: defineTextStyle({
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.medium,
  }),
  body: defineTextStyle({
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.regular,
  }),
  bodyStrong: defineTextStyle({
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.semibold,
  }),
  subhead: defineTextStyle({
    fontSize: fontSizes.md,
    lineHeight: 22,
    fontWeight: fontWeights.bold,
  }),
  actionLabel: defineTextStyle({
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.bold,
  }),
  value: defineTextStyle({
    fontSize: 17,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  }),
  sectionTitle: defineTextStyle({
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.bold,
  }),
  cardTitle: defineTextStyle({
    fontSize: fontSizes.lg,
    lineHeight: 21,
    fontWeight: fontWeights.heavy,
    letterSpacing: -0.3,
  }),
  tabLabel: defineTextStyle({
    fontSize: fontSizes.md,
    lineHeight: 20,
    fontWeight: fontWeights.bold,
  }),
  headline: defineTextStyle({
    fontSize: fontSizes.xl,
    lineHeight: 26,
    fontWeight: fontWeights.heavy,
    letterSpacing: -0.3,
  }),
  badgeLabel: defineTextStyle({
    fontSize: 10,
    lineHeight: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  }),
  xlTitle: defineTextStyle({
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.xl,
  }),
  title: defineTextStyle({
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.xxl,
  }),
  hero: defineTextStyle({
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacing.xxxl,
  }),
} as const;

export type AppTextVariant = keyof typeof textStyles;
