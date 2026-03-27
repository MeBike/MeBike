import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

export const fontFamily = "Inter";

export const fontFaces = {
  regular: "Inter",
  medium: "InterMedium",
  semibold: "InterSemiBold",
  bold: "InterBold",
  heavy: "InterHeavy",
} as const;

export const appFontSources = {
  [fontFaces.regular]: Inter_400Regular,
  [fontFaces.medium]: Inter_500Medium,
  [fontFaces.semibold]: Inter_600SemiBold,
  [fontFaces.bold]: Inter_700Bold,
  [fontFaces.heavy]: Inter_800ExtraBold,
} as const;

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

export const fontTokenScale = {
  1: { fontSize: 10, lineHeight: 12, letterSpacing: 0.8 },
  2: { fontSize: fontSizes.xs, lineHeight: lineHeights.xs, letterSpacing: letterSpacing.xs },
  3: { fontSize: fontSizes.ssm, lineHeight: lineHeights.ssm, letterSpacing: letterSpacing.sm },
  4: { fontSize: fontSizes.sm, lineHeight: lineHeights.sm, letterSpacing: letterSpacing.sm },
  5: { fontSize: fontSizes.base, lineHeight: lineHeights.base, letterSpacing: letterSpacing.md },
  6: { fontSize: fontSizes.md, lineHeight: lineHeights.md, letterSpacing: letterSpacing.md },
  7: { fontSize: 17, lineHeight: lineHeights.md, letterSpacing: -0.2 },
  8: { fontSize: fontSizes.lg, lineHeight: lineHeights.lg, letterSpacing: letterSpacing.lg },
  9: { fontSize: 19, lineHeight: lineHeights.md, letterSpacing: letterSpacing.lg },
  10: { fontSize: fontSizes.xl, lineHeight: lineHeights.xl, letterSpacing: letterSpacing.xl },
  11: { fontSize: fontSizes.xxl, lineHeight: lineHeights.xxl, letterSpacing: letterSpacing.xxl },
  12: { fontSize: fontSizes.xxxl, lineHeight: lineHeights.xxxl, letterSpacing: letterSpacing.xxxl },
  13: { fontSize: fontSizes.display, lineHeight: lineHeights.display, letterSpacing: letterSpacing.display },
  14: { fontSize: 52, lineHeight: 54, letterSpacing: -1 },
} as const;

export const typographyTokens = {
  badge: "$1",
  caption: "$2",
  meta: "$3",
  label: "$4",
  bodySmall: "$5",
  body: "$6",
  value: "$7",
  section: "$8",
  price: "$9",
  headline: "$10",
  title: "$11",
  heroTitle: "$12",
  hero: "$13",
  metric: "$14",
} as const;

type AppTextStyle = {
  fontSize: `$${number}`;
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
    fontSize: typographyTokens.caption,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
  }),
  meta: defineTextStyle({
    fontSize: typographyTokens.meta,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.medium,
  }),
  eyebrow: defineTextStyle({
    fontSize: typographyTokens.meta,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.heavy,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  }),
  fieldLabel: defineTextStyle({
    fontSize: typographyTokens.meta,
    lineHeight: lineHeights.ssm,
    fontWeight: fontWeights.bold,
  }),
  label: defineTextStyle({
    fontSize: typographyTokens.label,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
  }),
  bodySmall: defineTextStyle({
    fontSize: typographyTokens.bodySmall,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.medium,
  }),
  body: defineTextStyle({
    fontSize: typographyTokens.body,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.regular,
  }),
  bodyStrong: defineTextStyle({
    fontSize: typographyTokens.body,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.semibold,
  }),
  compactStrong: defineTextStyle({
    fontSize: typographyTokens.bodySmall,
    lineHeight: 18,
    fontWeight: fontWeights.bold,
  }),
  subhead: defineTextStyle({
    fontSize: typographyTokens.body,
    lineHeight: 22,
    fontWeight: fontWeights.bold,
  }),
  actionLabel: defineTextStyle({
    fontSize: typographyTokens.body,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.bold,
  }),
  value: defineTextStyle({
    fontSize: typographyTokens.value,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  }),
  sectionTitle: defineTextStyle({
    fontSize: typographyTokens.section,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.bold,
  }),
  cardTitle: defineTextStyle({
    fontSize: typographyTokens.section,
    lineHeight: 21,
    fontWeight: fontWeights.heavy,
    letterSpacing: -0.3,
  }),
  tabLabel: defineTextStyle({
    fontSize: typographyTokens.body,
    lineHeight: 20,
    fontWeight: fontWeights.bold,
  }),
  headline: defineTextStyle({
    fontSize: typographyTokens.headline,
    lineHeight: 26,
    fontWeight: fontWeights.heavy,
    letterSpacing: -0.3,
  }),
  metricValue: defineTextStyle({
    fontSize: typographyTokens.metric,
    lineHeight: 54,
    fontWeight: fontWeights.heavy,
    letterSpacing: -1,
  }),
  priceValue: defineTextStyle({
    fontSize: typographyTokens.price,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.heavy,
  }),
  badgeLabel: defineTextStyle({
    fontSize: typographyTokens.badge,
    lineHeight: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  }),
  xlTitle: defineTextStyle({
    fontSize: typographyTokens.headline,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.xl,
  }),
  title: defineTextStyle({
    fontSize: typographyTokens.title,
    lineHeight: lineHeights.xxl,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.xxl,
  }),
  hero: defineTextStyle({
    fontSize: typographyTokens.hero,
    lineHeight: lineHeights.display,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacing.xxxl,
  }),
} as const;

export type AppTextVariant = keyof typeof textStyles;
