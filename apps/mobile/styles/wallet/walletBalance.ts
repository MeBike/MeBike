import { StyleSheet } from "react-native";

export const walletBalanceStyles = StyleSheet.create({
  gradient: {
    paddingTop: 32,
    paddingBottom: 38,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 8,
    alignItems: "center",
    elevation: 8,
  },
  header: {
    width: "100%",
    alignItems: "flex-start",
    marginTop: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  balanceCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#e0eaff",
    marginBottom: 10,
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  walletIcon: {
    marginLeft: 4,
  },
});
