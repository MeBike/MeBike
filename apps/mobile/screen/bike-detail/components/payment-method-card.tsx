import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { borderWidths } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { Pressable } from "react-native";
import { XStack, YStack } from "tamagui";

import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Subscription } from "@/types/subscription-types";

import type { PaymentMode } from "../types";

import { bikeDetailTextStyles } from "../text-styles";

function PaymentOption({
  title,
  subtitle,
  icon,
  isActive,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <YStack
          backgroundColor={isActive ? "$surfaceAccent" : "$surface"}
          borderColor={isActive ? "$brandPrimary" : "$borderSubtle"}
          borderRadius="$3"
          borderWidth={borderWidths.strong}
          opacity={pressed ? 0.9 : 1}
          padding="$3"
        >
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2" justifyContent="space-between">
              <XStack alignItems="center" flex={1} gap="$2">
                <IconSymbol color={isActive ? colors.brandPrimary : colors.textMuted} name={icon} size={20} />
                <AppText style={[bikeDetailTextStyles.optionTitle, isActive ? bikeDetailTextStyles.optionTitleActive : null]}>
                  {title}
                </AppText>
              </XStack>

              {isActive
                ? <IconSymbol color={colors.brandPrimary} name="checkmark.circle.fill" size={18} />
                : null}
            </XStack>

            <AppText style={[bikeDetailTextStyles.optionSubtitle, isActive ? bikeDetailTextStyles.optionSubtitleActive : null]}>
              {subtitle}
            </AppText>
          </YStack>
        </YStack>
      )}
    </Pressable>
  );
}

function SubscriptionSelector({
  activeSubscriptions,
  selectedSubscriptionId,
  onSelectSubscription,
}: {
  activeSubscriptions: Subscription[];
  selectedSubscriptionId: string | null;
  onSelectSubscription: (subscriptionId: string) => void;
}) {
  return (
    <YStack gap="$2">
      {activeSubscriptions.map((subscription) => {
        const remaining = subscription.maxUsages != null
          ? Math.max(0, subscription.maxUsages - subscription.usageCount)
          : null;
        const isActive = subscription.id === selectedSubscriptionId;

        return (
          <Pressable key={subscription.id} onPress={() => onSelectSubscription(subscription.id)}>
            {({ pressed }) => (
              <XStack
                alignItems="center"
                backgroundColor={isActive ? "$surfaceAccent" : "$surfaceMuted"}
                borderColor={isActive ? "$brandPrimary" : "$borderSubtle"}
                borderRadius="$3"
                borderWidth={borderWidths.subtle}
                justifyContent="space-between"
                opacity={pressed ? 0.9 : 1}
                paddingHorizontal="$3"
                paddingVertical="$3"
              >
                <YStack flex={1} gap="$1" paddingRight="$2">
                  <AppText numberOfLines={1} style={bikeDetailTextStyles.subscriptionTitle}>
                    {subscription.packageName}
                  </AppText>
                  <AppText style={bikeDetailTextStyles.subscriptionMeta}>
                    {remaining != null ? `${remaining} / ${subscription.maxUsages} lượt còn lại` : "Không giới hạn lượt"}
                  </AppText>
                </YStack>

                <IconSymbol
                  color={isActive ? colors.brandPrimary : colors.textMuted}
                  name={isActive ? "checkmark.circle.fill" : "circle"}
                  size={20}
                />
              </XStack>
            )}
          </Pressable>
        );
      })}
    </YStack>
  );
}

export function PaymentMethodCard({
  paymentMode,
  canUseSubscription,
  walletBalance,
  activeSubscriptions,
  selectedSubscriptionId,
  onSelectPaymentMode,
  onSelectSubscription,
  navigation,
}: {
  paymentMode: PaymentMode;
  canUseSubscription: boolean;
  walletBalance: number | null;
  activeSubscriptions: Subscription[];
  selectedSubscriptionId: string | null;
  onSelectPaymentMode: (mode: PaymentMode) => void;
  onSelectSubscription: (subscriptionId: string) => void;
  navigation: BikeDetailNavigationProp;
}) {
  return (
    <AppCard borderRadius="$5" padding="$4">
      <YStack gap="$3">
        <XStack gap="$3">
          <PaymentOption
            icon="wallet.pass.fill"
            isActive={paymentMode === "wallet"}
            onPress={() => onSelectPaymentMode("wallet")}
            subtitle="Số dư hiện có"
            title="Ví MeBike"
          />
          <PaymentOption
            icon="creditcard.fill"
            isActive={paymentMode === "subscription"}
            onPress={() => onSelectPaymentMode("subscription")}
            subtitle={canUseSubscription ? "Gói đã đăng ký" : "Chưa có gói hoạt động"}
            title="Gói tháng"
          />
        </XStack>

        {paymentMode === "wallet"
          ? (
              <XStack
                alignItems="center"
                backgroundColor="$surfaceMuted"
                borderColor="$borderSubtle"
                borderRadius="$3"
                borderWidth={borderWidths.subtle}
                justifyContent="space-between"
                paddingHorizontal="$4"
                paddingVertical="$3"
              >
                <AppText style={bikeDetailTextStyles.balanceLabel}>Số dư khả dụng</AppText>
                <AppText style={bikeDetailTextStyles.balanceValue}>
                  {walletBalance != null ? `${walletBalance.toLocaleString("vi-VN")} đ` : "--"}
                </AppText>
              </XStack>
            )
          : null}

        {paymentMode === "subscription" && activeSubscriptions.length > 0
          ? <SubscriptionSelector activeSubscriptions={activeSubscriptions} onSelectSubscription={onSelectSubscription} selectedSubscriptionId={selectedSubscriptionId} />
          : null}

        {paymentMode === "subscription" && activeSubscriptions.length === 0
          ? (
              <XStack
                alignItems="center"
                backgroundColor="$surfaceMuted"
                borderColor="$borderSubtle"
                borderRadius="$3"
                borderWidth={borderWidths.subtle}
                justifyContent="space-between"
                paddingHorizontal="$4"
                paddingVertical="$3"
              >
                <AppText flex={1} style={bikeDetailTextStyles.balanceLabel}>Bạn chưa có gói tháng hoạt động</AppText>
                <Pressable onPress={() => navigation.navigate("Subscriptions")}>
                  {({ pressed }) => (
                    <AppText opacity={pressed ? 0.8 : 1} style={bikeDetailTextStyles.linkText}>
                      Xem gói tháng
                    </AppText>
                  )}
                </Pressable>
              </XStack>
            )
          : null}
      </YStack>
    </AppCard>
  );
}
