import { colors } from "@theme/colors";
import { fontSizes, fontWeights, letterSpacing, lineHeights } from "@theme/typography";
import { StyleSheet } from "react-native";

const walletBalanceStyles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.xl,
    color: colors.textOnBrand,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: "#e0eaff",
    marginBottom: 8,
    fontWeight: fontWeights.medium,
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: fontWeights.heavy,
    color: colors.textOnBrand,
    letterSpacing: letterSpacing.display,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: fontSizes.ssm,
    lineHeight: lineHeights.ssm,
    color: colors.textOnBrand,
    fontWeight: fontWeights.semibold,
  },
  walletIcon: {
    marginLeft: 12,
  },
});

export { walletBalanceStyles as styles };
