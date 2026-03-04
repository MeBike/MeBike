import { StyleSheet } from "react-native";

const transactionDetailModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    width: 108,
  },
  idValueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  amountOut: {
    color: "#F59E0B",
  },
  amountIn: {
    color: "#10B981",
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    flex: 1,
    textAlign: "right",
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginTop: 8,
    lineHeight: 20,
  },
});

export { transactionDetailModalStyles as styles };
