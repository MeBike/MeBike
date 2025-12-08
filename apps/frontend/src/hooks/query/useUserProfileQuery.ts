import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { DetailUser } from "@/services/auth.service";
import { AxiosError } from "axios";
import { QUERY_KEYS } from "@/constants/queryKey";


export const fetchUserProfile = async (): Promise<DetailUser> => {
  const response = await authService.getMe();
  if(response.status === 200){
    return response.data.result;
  }
  throw new Error("Failed to fetch user profile");
}
export function useUserProfileQuery(isAuthenticated: boolean) {
    return useQuery<DetailUser, AxiosError>({
        queryKey: QUERY_KEYS.AUTH.USER_PROFILE_QUERY_KEY,
        queryFn: fetchUserProfile,
        enabled: isAuthenticated,
        staleTime : 0,
    });
} 