import Cookies from "js-cookie"
const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';
const isBrowser = typeof window !== 'undefined';

export const getAccessToken = (): string | null => {
  if (!isBrowser) return null;
  return Cookies.get(ACCESS_TOKEN) ?? null;
};

export const getRefreshToken = () : string | null => {
    if (!isBrowser) return null;
    return Cookies.get(REFRESH_TOKEN) ?? null ;
}

export const setTokens = (
  access_token: string,
  refresh_token: string
): void => {
  if (!isBrowser) return;
  Cookies.set(ACCESS_TOKEN, access_token, {
    expires: 1 / 96, // 15 minutes
    secure: window.location.protocol === 'https:',
    sameSite: "strict",
    path: '/',
  });
  Cookies.set(REFRESH_TOKEN, refresh_token, {
    expires: 7,
    secure: window.location.protocol === 'https:',
    sameSite: "strict",
    path: '/',
  });
};

export const clearTokens = () : void => {
    if (!isBrowser) return;
    Cookies.remove(ACCESS_TOKEN, { path: '/' });
    Cookies.remove(REFRESH_TOKEN, { path: '/' });
}