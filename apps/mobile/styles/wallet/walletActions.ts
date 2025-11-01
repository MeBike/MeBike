import { StyleSheet } from "react-native";

export const walletActionsStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 4,
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
