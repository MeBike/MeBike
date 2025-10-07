import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import type { DetailUser } from "@/services/authService";
import { AxiosError } from "axios";

export const USER_PROFILE_QUERY_KEY = ["user","me"];


export const fetchUserProfile = async (): Promise<DetailUser> => {
  const response = await authService.getMe();
  if(response.status === 200){
    return response.data.result;
  }
  throw new Error("Failed to fetch user profile");
}
export function useUserProfileQuery(isAuthenticated: boolean) {
    return useQuery<DetailUser, AxiosError>({
        queryKey: USER_PROFILE_QUERY_KEY,
        queryFn: fetchUserProfile,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
} 