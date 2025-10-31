import type { AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";

import type { DetailUser } from "@services/auth.service";

import { authService } from "@services/auth.service";

export const USER_PROFILE_QUERY_KEY = ["user", "me"];

export async function fetchUserProfile(): Promise<DetailUser> {
  const response = await authService.getMe();
  if (response.status === 200) {
    return response.data.result;
  }
  throw new Error("Failed to fetch user profile");
}
export function useUserProfileQuery(isAuthenticated: boolean) {
  console.log("useUserProfileQuery enabled:", isAuthenticated);
  return useQuery<DetailUser, AxiosError>({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: fetchUserProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry failed requests
  });
}
