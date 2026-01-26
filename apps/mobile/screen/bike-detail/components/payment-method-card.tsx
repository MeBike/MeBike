import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { SubscriptionListItem } from "../../../types/subscription-types";

import { styles } from "../styles";

type PaymentMode = "wallet" | "subscription";

type Props = {
  paymentMode: PaymentMode;
  canUseSubscription: boolean;
  walletBalance: number | null;
  activeSubscriptions: SubscriptionListItem[];
  selectedSubscriptionId: string | null;
  remainingById: Record<string, number | null>;
  onSelectPaymentMode: (mode: PaymentMode) => void;
  onSelectSubscription: (id: string) => void;
  onNavigateSubscriptions: () => void;
};

export function PaymentMethodCard({
  paymentMode,
  canUseSubscription,
  walletBalance,
  activeSubscriptions,
  selectedSubscriptionId,
  remainingById,
  onSelectPaymentMode,
  onSelectSubscription,
  onNavigateSubscriptions,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
      <View style={styles.paymentToggle}>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            paymentMode === "wallet" && styles.paymentButtonActive,
          ]}
          onPress={() => onSelectPaymentMode("wallet")}
          activeOpacity={0.9}
        >
          <Text style={styles.paymentButtonLabel}>Ví MeBike</Text>
          <Text style={styles.paymentButtonHint}>
            Thanh toán bằng số dư hiện có
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            paymentMode === "subscription" && styles.paymentButtonActive,
            !canUseSubscription && styles.paymentButtonDisabled,
          ]}
          onPress={() => onSelectPaymentMode("subscription")}
          disabled={!canUseSubscription}
          activeOpacity={0.9}
        >
          <Text style={styles.paymentButtonLabel}>Gói tháng</Text>
          <Text style={styles.paymentButtonHint}>
            {canUseSubscription
              ? "Sử dụng gói đã đăng ký"
              : "Chưa có gói hoạt động"}
          </Text>
        </TouchableOpacity>
      </View>

      {paymentMode === "wallet" && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.helperText}>Số dư khả dụng</Text>
          <Text style={styles.walletBalance}>
            {walletBalance != null
              ? `${walletBalance.toLocaleString("vi-VN")} đ`
              : "--"}
          </Text>
        </View>
      )}

      {paymentMode === "subscription" && (
        <View style={{ marginTop: 16, gap: 12 }}>
          {activeSubscriptions.length === 0
            ? (
                <View style={styles.emptyState}>
                  <Text style={styles.helperText}>
                    Bạn chưa có gói tháng hoạt động.
                    {" "}
                    <Text style={styles.linkText} onPress={onNavigateSubscriptions}>
                      Đăng ký ngay
                    </Text>
                  </Text>
                </View>
              )
            : (
                <View style={styles.subscriptionList}>
                  {activeSubscriptions.map((subscription) => {
                    const remaining = remainingById[subscription._id] ?? null;
                    const isActive = subscription._id === selectedSubscriptionId;
                    return (
                      <TouchableOpacity
                        key={subscription._id}
                        style={[
                          styles.subscriptionCard,
                          isActive && styles.subscriptionCardActive,
                        ]}
                        onPress={() => onSelectSubscription(subscription._id)}
                        activeOpacity={0.9}
                      >
                        <View>
                          <Text style={styles.infoValue}>
                            {subscription.package_name.toUpperCase()}
                          </Text>
                          <Text style={styles.helperText}>
                            {remaining != null
                              ? `${remaining} / ${subscription.max_usages} lượt`
                              : "Không giới hạn"}
                          </Text>
                        </View>
                        <Ionicons
                          name={isActive ? "checkmark-circle" : "ellipse-outline"}
                          size={22}
                          color={BikeColors.primary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
        </View>
      )}
    </View>
  );
}
