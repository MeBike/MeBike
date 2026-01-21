import type { SubscriptionPackageInfo } from "@constants/subscriptionPackages";

import { SubscriptionDetailModal } from "@components/subscription/subscription-detail-modal";
import { SubscriptionHeader } from "@components/subscription/subscription-header";
import { SubscriptionToggle } from "@components/subscription/subscription-toggle";
import { useAuth } from "@providers/auth-providers";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  PackageListItem,
} from "@/types/subscription-types";

import { SubscriptionHistoryList } from "./components/subscription-history-list";
import { SubscriptionPlansList } from "./components/subscription-plans-list";
import { SubscriptionSummarySection } from "./components/subscription-summary-section";
import { usePackagesQuery } from "./hooks/use-packages-query";
import { useSubscriptionData } from "./hooks/use-subscription-data";
import { getSubscriptionErrorMessage } from "./hooks/use-subscription-errors";
import { useSubscriptionUi } from "./hooks/use-subscription-ui";
import { styles } from "./styles";

function mapPackages(
  packages: PackageListItem[],
  defaults: SubscriptionPackageInfo[],
) {
  if (!packages.length)
    return [];

  const activePackages = packages.filter(pkg => pkg.status === "Active");
  if (!activePackages.length)
    return [];

  return activePackages.map((pkg) => {
    const normalized = pkg.name.toLowerCase();
    const isUnlimited
      = pkg.usageType === "Infinite"
        || normalized.includes("unlimited")
        || normalized.includes("khong")
        || normalized.includes("gioi han");
    const isPremium
      = normalized.includes("pro")
        || normalized.includes("premium")
        || normalized.includes("nang")
        || (pkg.maxUsages ?? 0) >= 30;
    const fallbackKey = isUnlimited
      ? "unlimited"
      : isPremium
        ? "premium"
        : "basic";
    const fallback
      = defaults.find(item => item.id === fallbackKey) ?? defaults[0];
    return {
      ...fallback,
      backendId: pkg.id,
      title: pkg.name,
      price: Number(pkg.price),
      monthlyLimit: pkg.maxUsages ?? null,
    };
  });
}

export default function SubscriptionScreen() {
  const {
    activeSubscription,
    canSubscribe,
    invalidateSubscriptions,
    isActivating,
    isFetching,
    isLoading,
    pendingSubscription,
    refetch,
    subscribe,
    activate,
    subscriptions,
  } = useSubscriptionData();
  const {
    activeSection,
    handleSectionChange,
    packageCards,
    selectedId,
    setSelectedId,
    setSubscribingPackage,
    subscribingPackage,
  } = useSubscriptionUi();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const packagesQuery = usePackagesQuery();

  const packageItems = mapPackages(packagesQuery.data ?? [], packageCards);

  const refreshControl = (
    <RefreshControl
      refreshing={isFetching && !isLoading}
      onRefresh={refetch}
      tintColor="#2563EB"
    />
  );

  const handleSubscribe = (packageId: string) => {
    if (!isAuthenticated) {
      Alert.alert("Đăng nhập trước", "Bạn cần đăng nhập để đăng ký gói tháng", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng nhập",
          onPress: () => navigation.navigate("Login" as never),
        },
      ]);
      return;
    }

    Alert.alert(
      "Xác nhận đăng ký",
      "Bạn chắc chắn đăng ký gói này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: async () => {
            setSubscribingPackage(packageId);
            try {
              await subscribe({ packageId });
              Alert.alert("Thành công", "Đăng ký gói tháng thành công");
              invalidateSubscriptions();
            }
            catch (error) {
              Alert.alert(
                "Không thể đăng ký",
                getSubscriptionErrorMessage(error, "Vui lòng thử lại sau"),
              );
            }
            finally {
              setSubscribingPackage(null);
            }
          },
        },
      ],
    );
  };

  const handleActivate = () => {
    if (!pendingSubscription)
      return;
    Alert.alert(
      "Kích hoạt gói",
      "Gói sẽ bắt đầu tính thời gian ngay sau khi kích hoạt.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Kích hoạt",
          onPress: async () => {
            try {
              await activate({ id: pendingSubscription._id });
              Alert.alert("Thành công", "Gói đã được kích hoạt");
              invalidateSubscriptions();
            }
            catch (error) {
              Alert.alert(
                "Không thể kích hoạt",
                getSubscriptionErrorMessage(error, "Vui lòng thử lại sau"),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <SubscriptionHeader />
      <SafeAreaView
        style={styles.contentSafeArea}
        edges={["left", "right", "bottom"]}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <SubscriptionSummarySection
            activeSubscription={activeSubscription}
            pendingSubscription={pendingSubscription}
            onActivatePending={pendingSubscription ? handleActivate : undefined}
            activating={isActivating}
          />

          <SubscriptionToggle
            active={activeSection}
            onChange={handleSectionChange}
          />

          {activeSection === "plans" && (
            <SubscriptionPlansList
              packages={packageItems}
              activeSubscription={activeSubscription}
              pendingSubscription={pendingSubscription}
              canSubscribe={canSubscribe}
              subscribingPackage={subscribingPackage}
              onSubscribe={handleSubscribe}
              emptySubtitle={
                packagesQuery.isError
                  ? "Không thể tải danh sách gói. Vui lòng kéo để tải lại."
                  : "Hiện chưa có gói nào khả dụng. Vui lòng thử lại sau."
              }
            />
          )}

          {activeSection === "history" && (
            <SubscriptionHistoryList
              subscriptions={subscriptions}
              isLoading={isLoading}
              onSelect={setSelectedId}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      <SubscriptionDetailModal
        visible={Boolean(selectedId)}
        subscriptionId={selectedId}
        onClose={() => setSelectedId(undefined)}
      />
    </View>
  );
}
