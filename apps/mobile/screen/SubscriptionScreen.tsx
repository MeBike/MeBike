import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  SubscriptionListItem,
  SubscriptionPackage,
} from "@/types/subscription-types";

import { SubscriptionDetailModal } from "@components/subscription/subscription-detail-modal";
import { SubscriptionHistoryItem } from "@components/subscription/subscription-history-item";
import { SubscriptionPackageCard } from "@components/subscription/subscription-package-card";
import { SubscriptionSummary } from "@components/subscription/subscription-summary";
import { SUBSCRIPTION_PACKAGES } from "@constants/subscriptionPackages";
import { useGetSubscriptionsQuery } from "@hooks/query/Subscription/useGetSubscriptionsQuery";
import { useActivateSubscriptionMutation } from "@hooks/mutations/Subscription/useActivateSubscriptionMutation";
import { useSubscribeMutation } from "@hooks/mutations/Subscription/useSubscribeMutation";
import { useAuth } from "@providers/auth-providers";

const PAGE_SIZE = 20;

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as {
    response?: { data?: { message?: string; errors?: Record<string, { msg?: string }> } };
    message?: string;
  };
  const apiMessage = axiosError?.response?.data?.message;
  if (apiMessage) return apiMessage;
  const errors = axiosError?.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0];
    if (first?.msg) return first.msg;
  }
  if (axiosError?.message) return axiosError.message;
  return fallback;
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetSubscriptionsQuery({ page: 1, limit: PAGE_SIZE }, isAuthenticated);

  const subscriptions: SubscriptionListItem[] = data?.data ?? [];
  const activeSubscription = subscriptions.find((sub) => sub.status === "ĐANG HOẠT ĐỘNG") ?? null;
  const pendingSubscription = subscriptions.find((sub) => sub.status === "ĐANG CHỜ XỬ LÍ") ?? null;

  const subscribeMutation = useSubscribeMutation();
  const activateMutation = useActivateSubscriptionMutation();

  const canSubscribe = !pendingSubscription && !activeSubscription;

  const handleSubscribe = useCallback(
    (packageName: SubscriptionPackage) => {
      if (!isAuthenticated) {
        Alert.alert("Đăng nhập trước", "Bạn cần đăng nhập để đăng ký gói tháng", [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng nhập", onPress: () => navigation.navigate("Login" as never) },
        ]);
        return;
      }

      Alert.alert(
        "Xác nhận đăng ký",
        `Bạn chắc chắn đăng ký gói ${packageName.toUpperCase()}?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đồng ý",
            onPress: () => {
              subscribeMutation.mutate(
                { package_name: packageName },
                {
                  onSuccess: () => {
                    Alert.alert("Thành công", "Đăng ký gói tháng thành công");
                    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
                  },
                  onError: (error) => {
                    Alert.alert("Không thể đăng ký", getErrorMessage(error, "Vui lòng thử lại sau"));
                  },
                },
              );
            },
          },
        ],
      );
    },
    [isAuthenticated, navigation, queryClient, subscribeMutation],
  );

  const handleActivate = useCallback(() => {
    if (!pendingSubscription) return;
    Alert.alert(
      "Kích hoạt gói",
      "Gói sẽ bắt đầu tính thời gian ngay sau khi kích hoạt.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Kích hoạt",
          onPress: () => {
            activateMutation.mutate(pendingSubscription._id, {
              onSuccess: () => {
                Alert.alert("Thành công", "Gói đã được kích hoạt");
                queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
              },
              onError: (error) => {
                Alert.alert("Không thể kích hoạt", getErrorMessage(error, "Vui lòng thử lại sau"));
              },
            });
          },
        },
      ],
    );
  }, [activateMutation, pendingSubscription, queryClient]);

  const refreshControl = (
    <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor="#2563EB" />
  );

  const packageCards = useMemo(() => Object.values(SUBSCRIPTION_PACKAGES), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Gói thành viên</Text>
          <Text style={styles.subheading}>Tối ưu chi phí và giữ xe dễ dàng hơn</Text>
        </View>

        <SubscriptionSummary
          activeSubscription={activeSubscription}
          pendingSubscription={pendingSubscription}
          onActivatePending={pendingSubscription ? handleActivate : undefined}
          activating={activateMutation.isPending}
        />

        <Text style={styles.sectionLabel}>Chọn gói phù hợp</Text>
        {packageCards.map((pkg) => (
          <SubscriptionPackageCard
            key={pkg.id}
            info={pkg}
            disabled={!canSubscribe}
            isCurrent={pkg.id === activeSubscription?.package_name || pkg.id === pendingSubscription?.package_name}
            loading={subscribeMutation.isPending}
            onSubscribe={() => handleSubscribe(pkg.id)}
          />
        ))}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionLabel}>Lịch sử gói của bạn</Text>
          <Text style={styles.historyCount}>{subscriptions.length} gói</Text>
        </View>

        {isLoading && <Text style={styles.hintText}>Đang tải lịch sử...</Text>}
        {!isLoading && subscriptions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chưa có gói nào</Text>
            <Text style={styles.emptySubtitle}>Khi đăng ký gói, bạn sẽ thấy lịch sử tại đây.</Text>
          </View>
        )}

        {subscriptions.map((subscription: SubscriptionListItem) => (
          <SubscriptionHistoryItem
            key={subscription._id}
            subscription={subscription}
            onPress={(item) => setSelectedId(item._id)}
          />
        ))}
      </ScrollView>

      <SubscriptionDetailModal visible={Boolean(selectedId)} subscriptionId={selectedId} onClose={() => setSelectedId(undefined)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  subheading: {
    color: "#6B7280",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 12,
  },
  historyHeader: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyCount: {
    color: "#6B7280",
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  emptySubtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 6,
  },
  hintText: {
    color: "#6B7280",
    marginBottom: 12,
  },
});
