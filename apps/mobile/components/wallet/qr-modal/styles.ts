import { colors } from "@theme/colors";
import { borderWidths, elevations, radii, spacing } from "@theme/metrics";
import { fontSizes, fontWeights, lineHeights } from "@theme/typography";
import { StyleSheet } from "react-native";

const qrModalStyles = StyleSheet.create({
  overlayShell: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  backdropPressable: {
    flex: 1,
  },
  sheetHost: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    ...elevations.medium,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: radii.round,
    backgroundColor: colors.divider,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radii.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.88,
  },
  description: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    lineHeight: 36,
  },
  amountField: {
    minHeight: 92,
    borderWidth: borderWidths.strong,
    borderColor: colors.brandPrimary,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceAccent,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    paddingVertical: spacing.lg,
  },
  quickAmountsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  quickAmountChip: {
    flex: 1,
    minHeight: 58,
    borderRadius: radii.xl,
    borderWidth: borderWidths.subtle,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAmountChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  quickAmountChipPressed: {
    opacity: 0.92,
  },
  primaryButton: {
    minHeight: 84,
    borderRadius: radii.xxl,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...elevations.medium,
  },
  primaryButtonPressed: {
    opacity: 0.95,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: colors.textOnBrand,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.bold,
  },
});

export { qrModalStyles as styles };
