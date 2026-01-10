import type { AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";

import type { DetailUser } from "@services/auth.service";

import { authService } from "@services/auth.service";
import { Me } from "@/types";

export const USER_PROFILE_QUERY_KEY = ["user", "me"];

export async function fetchUserProfile(): Promise<Me> {
  const response = await authService.getMe();
  if (response.status === 200) {
    console.log(response.data.data?.User.data)
    return response.data.data?.User.data as Me;
  }
  throw new Error("Failed to fetch user profile"); 
}
export function useUserProfileQuery(isAuthenticated: boolean) {
  console.log("useUserProfileQuery enabled:", isAuthenticated);
  return useQuery<Me, AxiosError>({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: fetchUserProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: true, 
    refetchOnMount: true,
    refetchOnReconnect: true, 
  });
}
