import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
export const useGetStatusBikeIDQuery = (id: string) => {
    return useSuspenseQuery({
        queryKey: ["bikes", "status", id],
        queryFn: () => bikeService.getStatusBikeByIdAdmin(id)
    })
}