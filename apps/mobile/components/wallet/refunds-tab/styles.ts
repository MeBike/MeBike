import { StyleSheet } from "react-native";

const refundsTabStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  loadMoreText: {
    fontSize: 13,
    color: "#0066FF",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
  },
});

export { refundsTabStyles as styles };
