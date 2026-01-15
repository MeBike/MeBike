import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

const ACCESS_TOKEN = "access_token";
const REFRESH_TOKEN = "refresh_token";
const RESET_TOKEN = "reset_token";

export const AUTH_EVENTS = {
  TOKEN_UPDATED: "auth:token_updated",
};

export async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN);
  }
  catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN);
  }
  catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
}

export async function setTokens(access_token: string, refresh_token: string): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN, access_token],
      [REFRESH_TOKEN, refresh_token],
    ]);
    DeviceEventEmitter.emit(AUTH_EVENTS.TOKEN_UPDATED);
  }
  catch (error) {
    console.error("Error saving tokens:", error);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
    DeviceEventEmitter.emit(AUTH_EVENTS.TOKEN_UPDATED);
  }
  catch (error) {
    console.error("Error clearing tokens:", error);
  }
}
export async function setResetToken(reset_token: string): Promise<void> {
  try {
    if (!reset_token || reset_token.trim() === "") {
      console.warn("Attempting to save empty reset token");
      return;
    }
    await AsyncStorage.setItem(RESET_TOKEN, reset_token);
    console.log("Reset token saved successfully");
  }
  catch (error) {
    console.error("Error saving reset token:", error);
  }
}
export async function getResetToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(RESET_TOKEN);
  }
  catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
}
