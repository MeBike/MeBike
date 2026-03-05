import { StyleSheet } from "react-native";

export const myWalletScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F6FB",
  },
  gradient: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 2,
    alignItems: "center",
    elevation: 0,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  listContainer: {
    paddingBottom: 20,
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
