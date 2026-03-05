import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Subscription } from "@/types/subscription-types";

import { BikeColors } from "@constants/BikeColors";

type SubscriptionSelectionProps = {
  subscriptions: Subscription[];
  selectedSubscriptionId: string | null;
  lockPaymentSelection: boolean;
  onSelect: (subscriptionId: string) => void;
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  subscriptionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: BikeColors.surface,
    borderWidth: 1,
    borderColor: "transparent",
  },
  subscriptionCardActive: {
    borderColor: BikeColors.primary,
  },
  subscriptionCardLocked: {
    opacity: 0.7,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  subscriptionMeta: {
    fontSize: 13,
    color: BikeColors.textSecondary,
    marginTop: 4,
  },
});

export function SubscriptionSelection({
  subscriptions,
  selectedSubscriptionId,
  lockPaymentSelection,
  onSelect,
}: SubscriptionSelectionProps) {
  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gói tháng</Text>
      {subscriptions.map((subscription) => {
        const remaining = subscription.maxUsages != null
          ? Math.max(0, subscription.maxUsages - subscription.usageCount)
          : null;
        return (
          <TouchableOpacity
            key={subscription.id}
            style={[
              styles.subscriptionCard,
              subscription.id === selectedSubscriptionId && styles.subscriptionCardActive,
              lockPaymentSelection && styles.subscriptionCardLocked,
            ]}
            onPress={
              lockPaymentSelection
                ? undefined
                : () => onSelect(subscription.id)
            }
            disabled={lockPaymentSelection}
          >
            <View>
              <Text style={styles.subscriptionName}>
                {subscription.packageName.toUpperCase()}
              </Text>
              {remaining != null
                ? (
                    <Text style={styles.subscriptionMeta}>
                      {remaining}
                      {" "}
                      /
                      {subscription.maxUsages}
                      {" "}
                      lượt còn lại
                    </Text>
                  )
                : (
                    <Text style={styles.subscriptionMeta}>
                      Không giới hạn lượt
                    </Text>
                  )}
            </View>
            <Ionicons
              name={subscription.id === selectedSubscriptionId
                ? "checkmark-circle"
                : "ellipse-outline"}
              size={22}
              color={BikeColors.primary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
