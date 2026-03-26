import { shorthands } from "@tamagui/shorthands";
import { createFont, createTamagui, createTokens, isWeb } from "tamagui";

import { colorRampTokens, lightThemeDefinition } from "@theme/colors";
import { radii, spaceScale } from "@theme/metrics";
import { fontFaces, fontFamily, fontTokenScale, fontWeights } from "@theme/typography";

function mapFontScale<K extends keyof typeof fontTokenScale>(key: "fontSize" | "lineHeight" | "letterSpacing") {
  return Object.fromEntries(
    Object.entries(fontTokenScale).map(([scale, values]) => [scale, values[key]]),
  ) as Record<K, (typeof fontTokenScale)[K][typeof key]>;
}

const appFont = createFont({
  family: isWeb ? fontFamily : fontFamily,
  size: mapFontScale("fontSize"),
  lineHeight: mapFontScale("lineHeight"),
  weight: {
    4: fontWeights.regular,
    5: fontWeights.medium,
    6: fontWeights.semibold,
    7: fontWeights.bold,
    8: fontWeights.heavy,
  },
  letterSpacing: mapFontScale("letterSpacing"),
  face: {
    400: { normal: fontFaces.regular },
    500: { normal: fontFaces.medium },
    600: { normal: fontFaces.semibold },
    700: { normal: fontFaces.bold },
    800: { normal: fontFaces.heavy },
  },
});

const tokens = createTokens({
  color: {
    ...colorRampTokens,
  },
  space: {
    0: spaceScale[0],
    1: spaceScale[1],
    2: spaceScale[2],
    3: spaceScale[3],
    4: spaceScale[4],
    true: spaceScale[4],
    5: spaceScale[5],
    6: spaceScale[6],
    7: spaceScale[7],
    8: spaceScale[8],
    9: spaceScale[9],
    10: spaceScale[10],
  },
  size: {
    0: 0,
    1: 16,
    2: 20,
    3: 24,
    4: 32,
    true: 32,
    5: 40,
    6: 48,
    7: 56,
  },
  radius: {
    0: 0,
    1: radii.sm,
    2: radii.md,
    3: radii.lg,
    4: radii.xl,
    5: radii.xxl,
    round: radii.round,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
  },
});

export const appTamaguiConfig = createTamagui({
  defaultFont: "body",
  fonts: {
    body: appFont,
    heading: appFont,
  },
  tokens,
  themes: {
    light: lightThemeDefinition,
  },
  media: {
    short: { maxHeight: 780 },
    tall: { minHeight: 781 },
  },
  shorthands,
  settings: {
    disableSSR: true,
  },
});

export type AppTamaguiConfig = typeof appTamaguiConfig;

declare module "tamagui" {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default appTamaguiConfig;
