import type { SubscriptionSectionKey } from "@components/subscription/subscription-toggle";
import type { SubscriptionError } from "@services/subscription.service";

import { useActivateSubscriptionMutation } from "@hooks/mutations/subscription/use-activate-subscription-mutation";
import { useSubscribeMutation } from "@hooks/mutations/subscription/use-subscribe-mutation";
import { useGetSubscriptionsQuery } from "@hooks/query/subscription/use-get-subscriptions-query";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation } from "@react-navigation/native";
import { subscriptionErrorMessage } from "@services/subscription.service";
import { useQueryClient } from "@tanstack/react-query";
import { toSubscriptionStatusLabel } from "@utils/subscription";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import type { Subscription, SubscriptionPackage } from "@/types/subscription-types";

import { loadSubscriptionSection, saveSubscriptionSection } from "../lib/section-storage";

const PAGE_SIZE = 20;

function messageFromError(error: unknown, fallback: string): string {
  const sub = error as SubscriptionError;
  if (sub && typeof sub === "object" && "_tag" in sub) {
    return subscriptionErrorMessage(sub);
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useSubscriptionScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthNext();

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [activeSection, setActiveSection] = useState<SubscriptionSectionKey>("plans");
  const [subscribingPackage, setSubscribingPackage] = useState<SubscriptionPackage | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetSubscriptionsQuery({ page: 1, pageSize: PAGE_SIZE }, isAuthenticated);

  const subscriptions: Subscription[] = data?.data ?? [];
  const activeSubscription = subscriptions.find(sub => toSubscriptionStatusLabel(sub.status) === "ĐANG HOẠT ĐỘNG") ?? null;
  const pendingSubscription = subscriptions.find(sub => toSubscriptionStatusLabel(sub.status) === "ĐANG CHỜ XỬ LÍ") ?? null;

  const canSubscribe = !pendingSubscription && !activeSubscription;

  const subscribeMutation = useSubscribeMutation();
  const activateMutation = useActivateSubscriptionMutation();

  useEffect(() => {
    loadSubscriptionSection().then((saved) => {
      if (saved) {
        setActiveSection(saved);
      }
    }).catch(() => {});
  }, []);

  const handleSectionChange = useCallback(async (section: SubscriptionSectionKey) => {
    setActiveSection(section);
    await saveSubscriptionSection(section);
  }, []);

  const openLogin = useCallback(() => {
    navigation.navigate("Login" as never);
  }, [navigation]);

  const handleSubscribe = useCallback((packageName: SubscriptionPackage) => {
    if (!isAuthenticated) {
      Alert.alert("Đăng nhập trước", "Bạn cần đăng nhập để đăng ký gói tháng", [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng nhập", onPress: openLogin },
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
              { packageName },
              {
                onSuccess: () => {
                  Alert.alert("Thành công", "Đăng ký gói tháng thành công");
                  queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
                },
                onError: (error) => {
                  Alert.alert(
                    "Không thể đăng ký",
                    messageFromError(error, "Vui lòng thử lại sau"),
                  );
                },
                onSettled: () => {
                  setSubscribingPackage(null);
                },
              },
            );
          },
        },
      ],
    );
  }, [isAuthenticated, openLogin, queryClient, subscribeMutation]);

  const handleActivate = useCallback(() => {
    if (!pendingSubscription) {
      return;
    }
    Alert.alert(
      "Kích hoạt gói",
      "Gói sẽ bắt đầu tính thời gian ngay sau khi kích hoạt.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Kích hoạt",
          onPress: () => {
            activateMutation.mutate(pendingSubscription.id, {
              onSuccess: () => {
                Alert.alert("Thành công", "Gói đã được kích hoạt");
                queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
              },
              onError: (error) => {
                Alert.alert(
                  "Không thể kích hoạt",
                  messageFromError(error, "Vui lòng thử lại sau"),
                );
              },
            });
          },
        },
      ],
    );
  }, [activateMutation, pendingSubscription, queryClient]);

  return {
    isAuthenticated,
    isLoading,
    isFetching,
    refetch,
    subscriptions,
    activeSubscription,
    pendingSubscription,
    canSubscribe,
    subscribeMutation,
    activateMutation,

    selectedId,
    setSelectedId,
    activeSection,
    handleSectionChange,
    subscribingPackage,
    handleSubscribe,
    handleActivate,
  };
}
