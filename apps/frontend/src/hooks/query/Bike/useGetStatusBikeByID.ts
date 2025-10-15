import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";
export const useGetStatusBikeIDQuery = (id: string) => {
    return useQuery({
        queryKey: ["bikes", "status", id],
        queryFn: () => bikeService.getStatusBikeByIdAdmin(id),
    })
}