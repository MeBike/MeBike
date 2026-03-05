import { StyleSheet } from "react-native";

const walletHeaderStyles = StyleSheet.create({
  backButton: {
    position: "absolute",
    left: 4,
    zIndex: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    position: "absolute",
    right: 10,
    zIndex: 12,
    padding: 5,
  },
});

export { walletHeaderStyles as styles };
