import { colors } from "@theme/colors";
import { borderWidths, elevations, radii, spacing } from "@theme/metrics";
import { fontSizes, fontWeights, lineHeights } from "@theme/typography";
import { StyleSheet } from "react-native";

const transactionDetailModalStyles = StyleSheet.create({
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
    marginBottom: spacing.xl,
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
  block: {
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  label: {
    width: 102,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  valueGroup: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  value: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textPrimary,
    textAlign: "right",
    fontWeight: fontWeights.regular,
  },
  valueStrong: {
    fontWeight: fontWeights.bold,
  },
  valueSuccess: {
    color: colors.success,
  },
  valueWarning: {
    color: colors.warning,
  },
  valueDanger: {
    color: colors.error,
  },
  copyButton: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  copyButtonPressed: {
    opacity: 0.72,
  },
  fullReferenceCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: borderWidths.subtle,
    borderColor: colors.divider,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  fullReferenceText: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
});

export { transactionDetailModalStyles as styles };
