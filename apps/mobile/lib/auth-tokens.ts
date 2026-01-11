import { log } from "@lib/log";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN = "access_token";
const REFRESH_TOKEN = "refresh_token";

let isSecureStoreAvailable: boolean | undefined;

async function ensureSecureStoreAvailable(): Promise<boolean> {
  if (typeof isSecureStoreAvailable === "boolean") {
    return isSecureStoreAvailable;
  }

  try {
    isSecureStoreAvailable = await SecureStore.isAvailableAsync();
  }
  catch (error) {
    log.warn("SecureStore availability check failed", error);
    isSecureStoreAvailable = false;
  }

  return isSecureStoreAvailable;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const available = await ensureSecureStoreAvailable();
    if (!available) {
      return null;
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN);
  }
  catch {
    log.warn("SecureStore.getItemAsync failed (access token)");
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const available = await ensureSecureStoreAvailable();
    if (!available) {
      return null;
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN);
  }
  catch {
    log.warn("SecureStore.getItemAsync failed (refresh token)");
    return null;
  }
}

export async function setTokens(access_token: string, refresh_token: string): Promise<void> {
  try {
    const available = await ensureSecureStoreAvailable();
    if (!available) {
      return;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN, access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN, refresh_token);
  }
  catch {
    log.warn("SecureStore.setItemAsync failed (tokens)");
  }
}

export async function clearTokens(): Promise<void> {
  try {
    const available = await ensureSecureStoreAvailable();
    if (!available) {
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN);
  }
  catch {
    log.warn("SecureStore.deleteItemAsync failed (tokens)");
  }
}
