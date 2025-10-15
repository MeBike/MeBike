import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";
export const useGetBikeAdmin = () => {
    return useQuery({
        queryKey: ["bikes", "admin"],
        queryFn: () => bikeService.getBikesForAdmin(),
    })
}