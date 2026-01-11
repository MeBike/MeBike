import type { AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";

import type { Me } from "@/types";
import { authService } from "@services/auth.service";

export const USER_PROFILE_QUERY_KEY = ["user", "me"];

export async function fetchUserProfile(): Promise<Me> {
  const response = await authService.getMe();
  console.log("response", response);
  if (response.status === 200) {
    return response.data.data?.User.data as Me;
  }
  throw new Error("Failed to fetch user profile");
}
export function useUserProfileQuery(isAuthenticated: boolean) {
  console.log(">>> useUserProfileQuery calling with isAuthenticated:", isAuthenticated);
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
