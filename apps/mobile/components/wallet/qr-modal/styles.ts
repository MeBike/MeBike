import { StyleSheet } from "react-native";

import { borderWidths, elevations, radii, spaceScale } from "@theme/metrics";
import { fontSizes, fontWeights, lineHeights } from "@theme/typography";

type ThemeLike = Record<string, { val?: string } | undefined>;

export function createQrModalStyles(theme: ThemeLike) {
  const get = (key: string) => theme[key]?.val ?? "";

  return StyleSheet.create({
    overlayShell: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: get("overlayScrim"),
    },
    backdropPressable: {
      flex: 1,
    },
    sheetHost: {
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: get("surfaceDefault"),
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: spaceScale[6],
      paddingTop: spaceScale[3],
      paddingBottom: spaceScale[7],
      ...elevations.medium,
      shadowColor: get("shadowColor"),
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: radii.round,
      backgroundColor: get("borderDefault"),
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
      backgroundColor: get("surfaceMuted"),
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
      borderColor: get("actionPrimary"),
      borderRadius: radii.xl,
      backgroundColor: get("surfaceAccent"),
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
      color: get("textPrimary"),
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
      borderColor: get("borderDefault"),
      backgroundColor: get("surfaceDefault"),
      alignItems: "center",
      justifyContent: "center",
    },
    quickAmountChipActive: {
      backgroundColor: get("actionPrimary"),
      borderColor: get("actionPrimary"),
    },
    quickAmountChipPressed: {
      opacity: 0.92,
    },
    primaryButton: {
      minHeight: 84,
      borderRadius: radii.xxl,
      backgroundColor: get("actionPrimary"),
      alignItems: "center",
      justifyContent: "center",
      ...elevations.medium,
      shadowColor: get("shadowColor"),
    },
    primaryButtonPressed: {
      opacity: 0.95,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryText: {
      color: get("onActionPrimary"),
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontWeight: fontWeights.bold,
    },
  });
}
