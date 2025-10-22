import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
export const useGetStatusBikeQuery = () => {
    return useQuery({
        queryKey: ["bikes", "status"],
        queryFn: () => bikeService.getStatusBikeAdmin(),
    })
}