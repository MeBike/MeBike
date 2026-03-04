import { StyleSheet } from "react-native";

const transactionItemStyles = StyleSheet.create({
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  description: {
    fontSize: 13,
    fontWeight: "600",
    color: "#27364B",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaDivider: {
    fontSize: 12,
    color: "#A8B2C4",
    marginHorizontal: 6,
  },
  date: {
    fontSize: 12,
    color: "#8A95A8",
  },
  statusText: {
    fontSize: 12,
    color: "#7E8AA1",
    fontWeight: "700",
  },
  statusTextPending: {
    color: "#D97706",
  },
  statusTextFailed: {
    color: "#DC2626",
  },
  right: {
    alignItems: "flex-end",
    minWidth: 94,
    marginLeft: 10,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    color: "#667085",
    marginTop: 4,
    fontWeight: "600",
  },
});

export { transactionItemStyles as styles };
