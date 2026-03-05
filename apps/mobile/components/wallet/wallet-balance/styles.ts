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
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
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
    fontSize: 14,
    color: "#e0eaff",
    marginBottom: 8,
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: "800",
    color: "#fff",
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
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  walletIcon: {
    marginLeft: 12,
  },
});

export { walletBalanceStyles as styles };
