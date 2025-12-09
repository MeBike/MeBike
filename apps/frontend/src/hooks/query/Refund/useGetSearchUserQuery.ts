import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const fetchSearchUser = async (query: string) => {
  try {
    const response = await userService.getSearchUser(query);
    if (response.status === 200) {
      return response.data;
    }   
    } catch (error) {
    console.log(error);
    throw error;
  } 
};
export const useGetSearchUserQuery = (query: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.SEARCH_USER(query),
    queryFn: () => fetchSearchUser(query),
    enabled: !!query && query.length > 0,
    staleTime: 0,
  });
};