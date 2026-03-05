import { userService } from "@/services/user.service";
import { useQuery } from "@tanstack/react-query";

const fetchDetailUser = async (id: string) => { 
    const response = await userService.getDetailUser(id);
    return response;
}
export const useGetDetailUserQuery = (id: string) => {
  return useQuery({
    queryKey: ["user", "detail" , id],
    queryFn: () => fetchDetailUser(id),
    enabled: !!id,
  });
}
