import { StyleSheet } from "react-native";

const walletTabsStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#EAF0F8",
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6F5",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#667085",
  },
  activeTabText: {
    color: "#0066FF",
  },
});

export { walletTabsStyles as styles };
