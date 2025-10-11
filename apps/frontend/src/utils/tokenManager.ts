const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';


export const getAccessToken = () : string | null => {
    return localStorage.getItem(ACCESS_TOKEN);
}
export const getRefreshToken = () : string | null => {
    return localStorage.getItem(REFRESH_TOKEN);
}

export const setTokens = (access_token: string, refresh_token: string) : void => {
    localStorage.setItem(ACCESS_TOKEN, access_token);
    localStorage.setItem(REFRESH_TOKEN, refresh_token);
}
export const clearTokens = () : void => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
}