import { UserRole } from "./checkAuth";
interface saveAuthDataProps{
    access_token:string;
    refresh_token:string;
    user_role : UserRole;
}
let accessTokenCache : string | null = null;

export const getAccessToken = ():string | null => {
    if(accessTokenCache){
        return accessTokenCache;
    }
    const stored = sessionStorage.getItem("access_token");
    if(stored){
        accessTokenCache = stored;
        return stored;
    }
    return null;
}
export const saveAuthData = (props: saveAuthDataProps) => {
    accessTokenCache = props.access_token;
    sessionStorage.setItem("access_token", props.access_token);
    document.cookie = `refresh_token=${props.refresh_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
};
export const clearAuthData = () => {
    accessTokenCache = null;
    sessionStorage.removeItem("access_token");
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
}
export const getRefreshTokenFromCookie = ():string | null => {
    const match = document.cookie.match(new RegExp('(^| )refresh_token=([^;]+)'));
    return match ? match[2] : null;
}
export const refreshAccessToken = async (baseURL: string): Promise<string | null> => {
  const refreshToken = getRefreshTokenFromCookie();
  if (!refreshToken) {
    clearAuthData();
    return null;
  }
  try {
    const response = await fetch(`${baseURL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (response.ok) {
      const data = await response.json();
      saveAuthData({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_role: data.user_role,
      });
      return data.access_token;
    }
    
    clearAuthData();
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthData();
    return null;
  }
}