import { elevations, radii, spaceScale } from "@theme/metrics";
import { fontSizes, fontWeights, lineHeights } from "@theme/typography";
import { StyleSheet } from "react-native";

export type TransactionDetailModalThemePalette = {
  overlayScrim: string;
  surfaceDefault: string;
  shadowColor: string;
  borderDefault: string;
  surfaceMuted: string;
  textSecondary: string;
  textPrimary: string;
  statusSuccess: string;
  statusWarning: string;
  statusDanger: string;
};

export function createTransactionDetailModalStyles(theme: TransactionDetailModalThemePalette) {
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
    sheet: {
      backgroundColor: theme.surfaceDefault,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: spaceScale[7],
      paddingTop: spaceScale[3],
      paddingBottom: spaceScale[8],
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
      marginBottom: spaceScale[8],
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
    heroBlock: {
      alignItems: "center",
      paddingBottom: spaceScale[8],
      paddingHorizontal: spaceScale[2],
    },
    heroAmount: {
      fontSize: 44,
      lineHeight: 50,
      letterSpacing: -0.9,
      color: theme.textPrimary,
      fontWeight: fontWeights.bold,
      fontVariant: ["tabular-nums"],
      marginBottom: spaceScale[2],
    },
    heroTitle: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: theme.textSecondary,
      fontWeight: fontWeights.medium,
    },
    block: {
      gap: 0,
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderDefault,
      marginHorizontal: -spaceScale[7],
      marginBottom: spaceScale[4],
      opacity: 0.22,
    },
    rowDivider: {
      height: 1,
      backgroundColor: theme.borderDefault,
      marginHorizontal: -spaceScale[7],
      opacity: 0.08,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spaceScale[4],
      minHeight: 52,
    },
    label: {
      flexShrink: 0,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      color: theme.textSecondary,
      fontWeight: fontWeights.regular,
    },
    valueGroup: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: spaceScale[2],
    },
    value: {
      flex: 1,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      color: theme.textPrimary,
      textAlign: "right",
      fontWeight: fontWeights.semibold,
    },
    valueSuccess: {
      color: theme.statusSuccess,
    },
    valueWarning: {
      color: theme.statusWarning,
    },
    valueDanger: {
      color: theme.statusDanger,
    },
    copyButton: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    copyButtonPressed: {
      opacity: 0.72,
    },
  });
}
