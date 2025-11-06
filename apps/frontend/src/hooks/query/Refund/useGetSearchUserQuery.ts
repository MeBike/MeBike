import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
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
    queryKey: ["searchUser", query],
    queryFn: () => fetchSearchUser(query),
    enabled: !!query && query.length > 0,
    staleTime: 0,
  });
};