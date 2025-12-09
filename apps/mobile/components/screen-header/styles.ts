import { StyleSheet } from "react-native";

export const screenHeaderStyles = StyleSheet.create({
  standardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  standardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  rightAction: {
    marginLeft: 16,
  },

  centeredHeader: {
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: "center",
  },
  centeredTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  centeredSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },

  heroHeader: {
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroBackButton: {
    position: "absolute",
    top: 0,
    left: 16,
    zIndex: 12,
    borderRadius: 30,
    padding: 6,
  },
  heroContent: {
    alignItems: "center",
    marginTop: 14,
  },
  heroTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#e0eaff",
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },

  pageHeader: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
});
