import { lightThemeColors } from "@theme/colors";

export const spaceScale = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const;

export const spacing = {
  none: spaceScale[0],
  xs: spaceScale[1],
  sm: spaceScale[2],
  md: spaceScale[3],
  lg: spaceScale[4],
  xl: spaceScale[5],
  xxl: spaceScale[6],
  xxxl: spaceScale[7],
  xxxxl: spaceScale[9],
} as const;

export const spacingRules = {
  page: {
    inset: spaceScale[4],
    insetWide: spaceScale[5],
    sectionGap: spaceScale[5],
  },
  card: {
    paddingCompact: spaceScale[4],
    paddingDefault: spaceScale[5],
    contentGap: spaceScale[3],
    sectionGap: spaceScale[4],
  },
  list: {
    rowPaddingX: spaceScale[4],
    rowPaddingY: spaceScale[3],
    rowGap: spaceScale[3],
    sectionGap: spaceScale[2],
  },
  control: {
    paddingX: spaceScale[4],
    paddingY: spaceScale[3],
    compactGap: spaceScale[2],
  },
  sheet: {
    padding: spaceScale[5],
    contentGap: spaceScale[4],
  },
  hero: {
    paddingX: spaceScale[5],
    paddingTop: spaceScale[4],
    paddingBottomCompact: spaceScale[7],
    paddingBottomDefault: spaceScale[9],
    contentGap: spaceScale[3],
  },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  round: 999,
} as const;

export const borderWidths = {
  none: 0,
  subtle: 1,
  strong: 2,
  heavy: 3,
} as const;

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  hero: 44,
  jumbo: 60,
} as const;

export const elevations = {
  soft: {
    shadowColor: lightThemeColors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: lightThemeColors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
} as const;
