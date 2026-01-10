import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

const ACCESS_TOKEN = "access_token";
const REFRESH_TOKEN = "refresh_token";

export const TOKEN_EVENT = "token:changed";

export async function getAccessToken(): Promise<string | null> {
  return await AsyncStorage.getItem(ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return await AsyncStorage.getItem(REFRESH_TOKEN);
}

export async function setTokens(access_token: string, refresh_token: string): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN, access_token],
    [REFRESH_TOKEN, refresh_token],
  ]);
  DeviceEventEmitter.emit(TOKEN_EVENT);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
  DeviceEventEmitter.emit(TOKEN_EVENT);
}