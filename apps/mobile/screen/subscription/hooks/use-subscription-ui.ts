import type { SubscriptionSectionKey } from "@components/subscription/subscription-toggle";

import { SUBSCRIPTION_PACKAGES } from "@constants/subscriptionPackages";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SubscriptionPackage } from "@/types/subscription-types";

import { log } from "@/lib/logger";

const SECTION_STORAGE_KEY = "subscription_active_section";

type UiState = {
  activeSection: SubscriptionSectionKey;
  selectedId?: string;
  subscribingPackage: SubscriptionPackage | null;
};

export function useSubscriptionUi() {
  const [state, setState] = useState<UiState>({
    activeSection: "plans",
    selectedId: undefined,
    subscribingPackage: null,
  });

  useEffect(() => {
    const loadSection = async () => {
      try {
        const saved = await AsyncStorage.getItem(SECTION_STORAGE_KEY);
        if (saved === "plans" || saved === "history") {
          setState(prev => ({ ...prev, activeSection: saved }));
        }
      }
      catch (error) {
        log.warn("[Subscription] Failed to load section preference", error);
      }
    };

    loadSection();
  }, []);

  const handleSectionChange = useCallback(
    async (section: SubscriptionSectionKey) => {
      setState(prev => ({ ...prev, activeSection: section }));
      try {
        await AsyncStorage.setItem(SECTION_STORAGE_KEY, section);
      }
      catch (error) {
        log.warn("[Subscription] Failed to persist section preference", error);
      }
    },
    [],
  );

  const setSelectedId = useCallback((id?: string) => {
    setState(prev => ({ ...prev, selectedId: id }));
  }, []);

  const setSubscribingPackage = useCallback(
    (pkg: SubscriptionPackage | null) => {
      setState(prev => ({ ...prev, subscribingPackage: pkg }));
    },
    [],
  );

  const packageCards = useMemo(() => Object.values(SUBSCRIPTION_PACKAGES), []);

  return {
    activeSection: state.activeSection,
    handleSectionChange,
    packageCards,
    selectedId: state.selectedId,
    setSelectedId,
    setSubscribingPackage,
    subscribingPackage: state.subscribingPackage,
  };
}
