import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { Me } from "@/types/GraphQL";
import { AxiosError } from "axios";
import { QUERY_KEYS } from "@/constants/queryKey";


export const fetchUserProfile = async (): Promise<Me> => {
  const response = await authService.getMe();
  if (response.status === 200) {
    return response.data?.data?.User.data as Me;
  }
  throw new Error("Failed to fetch user profile");
};
export function useUserProfileQuery(isAuthenticated: boolean) {
    return useQuery<Me, AxiosError>({
        queryKey: QUERY_KEYS.AUTH.USER_PROFILE_QUERY_KEY,
        queryFn: fetchUserProfile,
        enabled: isAuthenticated,
        staleTime : 0,
    });
} 