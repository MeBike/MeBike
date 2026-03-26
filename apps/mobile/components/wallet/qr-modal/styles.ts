import { borderWidths, elevations, radii, spaceScale } from "@theme/metrics";
import { fontSizes, fontWeights, lineHeights } from "@theme/typography";
import { StyleSheet } from "react-native";

export type QrModalThemePalette = {
  overlayScrim: string;
  surfaceDefault: string;
  borderDefault: string;
  surfaceMuted: string;
  actionPrimary: string;
  surfaceAccent: string;
  textPrimary: string;
  shadowColor: string;
  onActionPrimary: string;
};

export function createQrModalStyles(theme: QrModalThemePalette) {
  return StyleSheet.create({
    overlayShell: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlayScrim,
    },
    backdropPressable: {
      flex: 1,
    },
    sheetHost: {
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.surfaceDefault,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: spaceScale[6],
      paddingTop: spaceScale[3],
      paddingBottom: spaceScale[7],
      ...elevations.medium,
      shadowColor: theme.shadowColor,
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: radii.round,
      backgroundColor: theme.borderDefault,
      alignSelf: "center",
      marginBottom: spaceScale[5],
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spaceScale[3],
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: radii.round,
      backgroundColor: theme.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonPressed: {
      opacity: 0.88,
    },
    description: {
      marginTop: spaceScale[4],
      marginBottom: spaceScale[5],
      lineHeight: 36,
    },
    amountField: {
      minHeight: 92,
      borderWidth: borderWidths.strong,
      borderColor: theme.actionPrimary,
      borderRadius: radii.xl,
      backgroundColor: theme.surfaceAccent,
      paddingHorizontal: spaceScale[5],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    amountInput: {
      flex: 1,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: fontWeights.heavy,
      color: theme.textPrimary,
      paddingVertical: spaceScale[4],
    },
    quickAmountsRow: {
      flexDirection: "row",
      gap: spaceScale[3],
      marginTop: spaceScale[4],
      marginBottom: spaceScale[7],
    },
    quickAmountChip: {
      flex: 1,
      minHeight: 58,
      borderRadius: radii.xl,
      borderWidth: borderWidths.subtle,
      borderColor: theme.borderDefault,
      backgroundColor: theme.surfaceDefault,
      alignItems: "center",
      justifyContent: "center",
    },
    quickAmountChipActive: {
      backgroundColor: theme.actionPrimary,
      borderColor: theme.actionPrimary,
    },
    quickAmountChipPressed: {
      opacity: 0.92,
    },
    primaryButton: {
      minHeight: 84,
      borderRadius: radii.xxl,
      backgroundColor: theme.actionPrimary,
      alignItems: "center",
      justifyContent: "center",
      ...elevations.medium,
      shadowColor: theme.shadowColor,
    },
    primaryButtonPressed: {
      opacity: 0.95,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryText: {
      color: theme.onActionPrimary,
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontWeight: fontWeights.bold,
    },
  });
}
