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
    width: 320,
    height: 320,
    marginVertical: 16,
    alignSelf: "center",
  },
  instruction: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  amountInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#0066FF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
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
