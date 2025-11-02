import { StyleSheet } from "react-native";

const loadingSpinnerStyles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  message: {
    marginTop: 12,
    fontSize: 14,
  },
});

export { loadingSpinnerStyles as styles };
