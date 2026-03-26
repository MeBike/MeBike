import { StyleSheet } from "react-native";

import { borderWidths, elevations, radii, spaceScale } from "@theme/metrics";
import { fontSizes, fontWeights, lineHeights } from "@theme/typography";

type ThemeLike = Record<string, { val?: string } | undefined>;

export function createTransactionDetailModalStyles(theme: ThemeLike) {
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
      marginBottom: spaceScale[5],
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
    block: {
      gap: spaceScale[3],
    },
    divider: {
      height: 1,
      backgroundColor: get("borderDefault"),
      marginVertical: spaceScale[1],
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spaceScale[4],
    },
    label: {
      width: 102,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      color: get("textSecondary"),
      fontWeight: fontWeights.medium,
    },
    valueGroup: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "flex-start",
      gap: spaceScale[2],
    },
    value: {
      flex: 1,
      fontSize: 17,
      lineHeight: 26,
      color: get("textPrimary"),
      textAlign: "right",
      fontWeight: fontWeights.regular,
    },
    valueStrong: {
      fontWeight: fontWeights.bold,
    },
    valueSuccess: {
      color: get("statusSuccess"),
    },
    valueWarning: {
      color: get("statusWarning"),
    },
    valueDanger: {
      color: get("statusDanger"),
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
      backgroundColor: get("surfaceMuted"),
      borderWidth: borderWidths.subtle,
      borderColor: get("borderDefault"),
      borderRadius: radii.lg,
      padding: spaceScale[4],
    },
    fullReferenceText: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: get("textPrimary"),
      fontWeight: fontWeights.medium,
    },
  });
}
