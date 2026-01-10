import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  SubscriptionListItem,
  SubscriptionPackage,
} from "@/types/subscription-types";

import { SubscriptionDetailModal } from "@components/subscription/subscription-detail-modal";
import { SubscriptionHeader } from "@components/subscription/subscription-header";
import { SubscriptionPlansSection } from "@components/subscription/subscription-plans-section";
import { SubscriptionHistorySection } from "@components/subscription/subscription-history-section";
import { SubscriptionSummary } from "@components/subscription/subscription-summary";
import { SubscriptionToggle, type SubscriptionSectionKey } from "@components/subscription/subscription-toggle";
import { SUBSCRIPTION_PACKAGES } from "@constants";
import { useGetSubscriptionsQuery } from "@hooks/query/Subscription/useGetSubscriptionsQuery";
import { useActivateSubscriptionMutation } from "@hooks/mutations/Subscription/useActivateSubscriptionMutation";
import { useSubscribeMutation } from "@hooks/mutations/Subscription/useSubscribeMutation";
import { useAuth } from "@providers/auth-providers";

const PAGE_SIZE = 20;
const SECTION_STORAGE_KEY = "subscription_active_section";

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
  const [activeSection, setActiveSection] = useState<SubscriptionSectionKey>("plans");
  const [subscribingPackage, setSubscribingPackage] = useState<SubscriptionPackage | null>(null);

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

  useEffect(() => {
    const loadSection = async () => {
      try {
        const saved = await AsyncStorage.getItem(SECTION_STORAGE_KEY);
        if (saved === "plans" || saved === "history") {
          setActiveSection(saved);
        }
      }
      catch (error) {
        console.log("Failed to load subscription section preference", error);
      }
      finally {
      }
    };

    loadSection();
  }, []);

  const handleSectionChange = useCallback(async (section: SubscriptionSectionKey) => {
    setActiveSection(section);
    try {
      await AsyncStorage.setItem(SECTION_STORAGE_KEY, section);
    }
    catch (error) {
      console.log("Failed to persist subscription section preference", error);
    }
  }, []);

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
              setSubscribingPackage(packageName);
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
                  onSettled: () => {
                    setSubscribingPackage(null);
                  }
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
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <SubscriptionHeader />
      <SafeAreaView style={styles.contentSafeArea} edges={['left','right','bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <SubscriptionSummary
            activeSubscription={activeSubscription}
            pendingSubscription={pendingSubscription}
            onActivatePending={pendingSubscription ? handleActivate : undefined}
            activating={activateMutation.isPending}
          />

          <SubscriptionToggle active={activeSection} onChange={handleSectionChange} />

          {activeSection === "plans" && (
            <SubscriptionPlansSection
              packages={packageCards}
              activeSubscription={activeSubscription}
              pendingSubscription={pendingSubscription}
              canSubscribe={canSubscribe}
              isLoading={(pkg) => subscribingPackage === pkg && subscribeMutation.isPending}
              onSubscribe={handleSubscribe}
            />
          )}

          {activeSection === "history" && (
            <SubscriptionHistorySection
              subscriptions={subscriptions}
              isLoading={isLoading}
              onSelect={setSelectedId}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      <SubscriptionDetailModal visible={Boolean(selectedId)} subscriptionId={selectedId} onClose={() => setSelectedId(undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  contentSafeArea: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
});
