import * as SecureStore from "expo-secure-store";

import { log } from "./log";

const PUSH_TOKEN_KEY = "expo_push_token";

export async function getPushToken(): Promise<string | null> {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      return null;
    }
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  }
  catch (error) {
    log.warn("SecureStore.getItemAsync failed (push token)", error);
    return null;
  }
}

export async function setPushToken(token: string): Promise<void> {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      return;
    }
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  }
  catch (error) {
    log.warn("SecureStore.setItemAsync failed (push token)", error);
  }
}

export async function clearPushToken(): Promise<void> {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      return;
    }
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
  catch (error) {
    log.warn("SecureStore.deleteItemAsync failed (push token)", error);
  }
}
