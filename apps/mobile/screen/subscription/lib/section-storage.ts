import type { SubscriptionSectionKey } from "@components/subscription/subscription-toggle";

import AsyncStorage from "@react-native-async-storage/async-storage";

const SECTION_STORAGE_KEY = "subscription_active_section";

export async function loadSubscriptionSection(): Promise<SubscriptionSectionKey | null> {
  try {
    const saved = await AsyncStorage.getItem(SECTION_STORAGE_KEY);
    if (saved === "plans" || saved === "history") {
      return saved;
    }
    return null;
  }
  catch {
    return null;
  }
}

export async function saveSubscriptionSection(section: SubscriptionSectionKey): Promise<void> {
  try {
    await AsyncStorage.setItem(SECTION_STORAGE_KEY, section);
  }
  catch {
    // ignore
  }
}
