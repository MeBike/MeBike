import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN = "access_token";
const REFRESH_TOKEN = "refresh_token";

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN);
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN);
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

export const setTokens = async (
  access_token: string,
  refresh_token: string
): Promise<void> => {c
  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN, access_token],
      [REFRESH_TOKEN, refresh_token],
    ]);
  } catch (error) {
    console.error("Error saving tokens:", error);
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
};
