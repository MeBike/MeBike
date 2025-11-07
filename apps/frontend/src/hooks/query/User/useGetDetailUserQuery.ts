import { userService } from "@/services/user.service";
import { useQuery } from "@tanstack/react-query";

const fetchDetailUser = async (id: string) => { 
    const response = await userService.getDetailUser(id);
    return response;
}
export const useGetDetailUserQuery = (id: string) => {
  return useQuery({
    queryKey: ["detail-user", id],
    queryFn: () => fetchDetailUser(id),
    enabled: !!id,
  });
}
