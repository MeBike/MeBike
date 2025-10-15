import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";
export const useGetStatusBike = (id: string) => {
    return useQuery({
        queryKey: ["bikes", "status", id],
        queryFn: () => bikeService.getStatusBikeByIdAdmin(id),
    })
}