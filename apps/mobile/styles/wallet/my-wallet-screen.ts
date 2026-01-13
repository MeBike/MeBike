import { StyleSheet } from "react-native";

export const myWalletScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  gradient: {
    paddingTop: 32,
    paddingBottom: 38,
    paddingHorizontal: 24,
    marginBottom: 8,
    alignItems: "center",
    elevation: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listContainer: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
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
