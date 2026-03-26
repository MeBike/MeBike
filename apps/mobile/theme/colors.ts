import {
  colorHierarchy,
  colorRamps,
  colorRampTokens,
  colorRoleRecipes,
  lightThemeColors,
  lightThemeDefinition,
} from "./color-system";

export const palette = colorRamps;

export const gradients = {
  brandHero: [lightThemeColors.actionPrimary, lightThemeColors.actionSecondary] as const,
  brandSoft: [colorRamps.primary[2], lightThemeColors.backgroundRaised] as const,
  accentSoft: [colorRamps.secondary[1], lightThemeColors.backgroundRaised] as const,
} as const;

export const bikeStatusColors = {
  AVAILABLE: lightThemeColors.statusSuccess,
  BOOKED: lightThemeColors.statusWarning,
  BROKEN: lightThemeColors.statusDanger,
  RESERVED: lightThemeColors.statusWarning,
  MAINTAINED: lightThemeColors.statusDanger,
  UNAVAILABLE: lightThemeColors.textDisabled,
} as const;

export const reservationStatusColors = {
  PENDING: lightThemeColors.statusWarning,
  ACTIVE: lightThemeColors.statusSuccess,
  FULFILLED: lightThemeColors.statusInfo,
  CANCELLED: lightThemeColors.statusDanger,
  EXPIRED: lightThemeColors.textDisabled,
} as const;

export { colorHierarchy, colorRamps, colorRampTokens, colorRoleRecipes, lightThemeColors, lightThemeDefinition };
