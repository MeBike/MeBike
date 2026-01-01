import Cookies from "js-cookie"
const ACCESS_TOKEN = 'accessToken';
const REFRESH_TOKEN = 'refreshToken';
const isBrowser = typeof window !== 'undefined';

export const getAccessToken = (): string | null => {
  if (!isBrowser) return null;
  return Cookies.get(ACCESS_TOKEN) ?? null;
};

export const getRefreshToken = () : string | null => {
    if (!isBrowser) return null;
    return Cookies.get(REFRESH_TOKEN) ?? null ;
}

export const getResetToken = () : string | null => {
    if (!isBrowser) return null;
    return Cookies.get('resetToken') ?? null ;
}
export const setResetToken = (token : string) : void => {
    if (!isBrowser) return;
    Cookies.set('resetToken', token, {
        expires: 1,
        secure: window.location.protocol === 'https:',
        sameSite: "strict",
        path: '/',
    });
}
export const clearResetToken = () : void => {
    if (!isBrowser) return;
    Cookies.remove('resetToken', { path: '/' });
}
export const setTokens = (
  access_token: string,
  refresh_token: string
): void => {
  if (!isBrowser) return;
  Cookies.set(ACCESS_TOKEN, access_token, {
    expires: 1, 
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