import { StyleSheet } from "react-native";

const qrModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginVertical: 16,
  },
  instruction: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  userId: {
    marginTop: 12,
    fontSize: 14,
    color: "#333",
  },
  shareButton: {
    marginTop: 16,
    backgroundColor: "#0066FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  shareText: {
    color: "#fff",
    fontWeight: "600",
  },
  closeButton: {
    marginTop: 12,
  },
  closeText: {
    color: "#666",
  },
});

export { qrModalStyles as styles };
