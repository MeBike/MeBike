import { SubscriptionDetailModal } from "@components/subscription/subscription-detail-modal";
import { SubscriptionHeader } from "@components/subscription/subscription-header";
import { SubscriptionHistorySection } from "@components/subscription/subscription-history-section";
import { SubscriptionPlansSection } from "@components/subscription/subscription-plans-section";
import { SubscriptionSummary } from "@components/subscription/subscription-summary";
import { SubscriptionToggle } from "@components/subscription/subscription-toggle";
import { SUBSCRIPTION_PACKAGES } from "@constants/subscriptionPackages";
import React, { useMemo } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  Subscription,
  SubscriptionPackage,
} from "@/types/subscription-types";

import { useSubscriptionScreen } from "./hooks/use-subscription-screen";

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

export default function SubscriptionScreen() {
  const {
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
  } = useSubscriptionScreen();

  const refreshControl = (
    <RefreshControl
      refreshing={isFetching && !isLoading}
      onRefresh={refetch}
      tintColor="#2563EB"
    />
  );

  const packageCards = useMemo(() => Object.values(SUBSCRIPTION_PACKAGES), []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <SubscriptionHeader />
      <SafeAreaView style={styles.contentSafeArea} edges={["left", "right", "bottom"]}>
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
              isLoading={(pkg: SubscriptionPackage) => subscribingPackage === pkg && subscribeMutation.isPending}
              onSubscribe={handleSubscribe}
            />
          )}

          {activeSection === "history" && (
            <SubscriptionHistorySection
              subscriptions={subscriptions as Subscription[]}
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
