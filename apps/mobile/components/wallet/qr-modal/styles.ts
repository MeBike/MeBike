import { borderWidths, elevations, radii, spaceScale } from "@theme/metrics";
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
      borderTopLeftRadius: radii.xxl,
      borderTopRightRadius: radii.xxl,
      paddingHorizontal: spaceScale[6],
      paddingTop: spaceScale[4],
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
      marginBottom: spaceScale[4],
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
    },
    amountField: {
      minHeight: 88,
      borderWidth: borderWidths.subtle,
      borderColor: "transparent",
      borderRadius: radii.xxl,
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: spaceScale[5],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    amountFieldFocused: {
      borderWidth: borderWidths.strong,
      borderColor: theme.actionPrimary,
      backgroundColor: theme.surfaceDefault,
    },
    amountInput: {
      flex: 1,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "700",
      letterSpacing: -0.4,
      color: theme.textPrimary,
      paddingVertical: spaceScale[4],
    },
    quickAmountsRow: {
      flexDirection: "row",
      gap: spaceScale[2],
      marginTop: spaceScale[3],
      marginBottom: spaceScale[6],
    },
    quickAmountChip: {
      flex: 1,
      minHeight: 52,
      borderRadius: radii.lg,
      borderWidth: borderWidths.subtle,
      borderColor: theme.borderDefault,
      backgroundColor: theme.surfaceDefault,
      alignItems: "center",
      justifyContent: "center",
    },
    quickAmountChipActive: {
      backgroundColor: theme.actionPrimary,
      borderColor: theme.actionPrimary,
      ...elevations.soft,
      shadowColor: theme.actionPrimary,
    },
    quickAmountChipPressed: {
      opacity: 0.92,
    },
    primaryButton: {
      minHeight: 72,
      borderRadius: radii.xxl,
      backgroundColor: theme.actionPrimary,
      alignItems: "center",
      justifyContent: "center",
      ...elevations.soft,
      shadowColor: theme.actionPrimary,
    },
    primaryButtonPressed: {
      opacity: 0.95,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
  });
}
