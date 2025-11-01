import { StyleSheet } from "react-native";

const walletTabsStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#0066FF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
});

export { walletTabsStyles as styles };
