import { StyleSheet } from "react-native";

const walletHeaderStyles = StyleSheet.create({
  backButton: {
    position: "absolute",
    left: 10,
    zIndex: 12,
    padding: 5,
  },
  settingsButton: {
    position: "absolute",
    right: 10,
    zIndex: 12,
    padding: 5,
  },
});

export { walletHeaderStyles as styles };
