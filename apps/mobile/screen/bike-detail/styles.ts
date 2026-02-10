import { StyleSheet } from "react-native";

import { BikeColors } from "@constants/BikeColors";

import type { Bike } from "@/types/BikeTypes";

const BIKE_STATUS_COLORS: Record<Bike["status"], string> = {
  "CÓ SẴN": "#4CAF50",
  "ĐANG ĐƯỢC THUÊ": "#FF9800",
  "BỊ HỎNG": "#F44336",
  "ĐÃ ĐẶT TRƯỚC": "#FF9800",
  "ĐANG BẢO TRÌ": "#F44336",
  "KHÔNG CÓ SẴN": "#999999",
};

export function getBikeStatusColor(status: Bike["status"]) {
  return BIKE_STATUS_COLORS[status] ?? "#999999";
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: BikeColors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  bikeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BikeColors.onSurface,
  },
  bikeTitleMono: {
    fontFamily: "monospace",
  },
  bikeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.onSurface,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  infoLabel: {
    color: BikeColors.onSurfaceVariant,
    flex: 1,
    paddingRight: 12,
  },
  infoValue: {
    fontWeight: "600",
    color: BikeColors.onSurface,
    flex: 1,
    textAlign: "right",
    flexShrink: 1,
  },
  reservationCard: {
    borderLeftWidth: 4,
    borderLeftColor: BikeColors.primary,
    paddingLeft: 12,
  },
  paymentToggle: {
    flexDirection: "row",
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BikeColors.primary,
    backgroundColor: BikeColors.surface,
  },
  paymentButtonDisabled: {
    opacity: 0.5,
  },
  paymentButtonActive: {
    backgroundColor: "#E8F1FF",
  },
  paymentButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: BikeColors.primary,
  },
  paymentButtonHint: {
    marginTop: 4,
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
  },
  subscriptionList: {
    gap: 12,
  },
  subscriptionCard: {
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subscriptionCardActive: {
    borderColor: BikeColors.primary,
    backgroundColor: "#E8F1FF",
  },
  helperText: {
    fontSize: 13,
    color: BikeColors.onSurfaceVariant,
  },
  linkText: {
    color: BikeColors.primary,
    fontWeight: "600",
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: "700",
    color: BikeColors.onSurface,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    gap: 12,
    backgroundColor: BikeColors.surface,
  },
  primaryButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: BikeColors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: BikeColors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: BikeColors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  emptyState: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF6E5",
    borderWidth: 1,
    borderColor: "#FFD9A1",
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
});
