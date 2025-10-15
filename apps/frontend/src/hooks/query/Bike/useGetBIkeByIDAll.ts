import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";
export const useGetBikeByIDAllQuery = (id: string) => {
    return useQuery({
        queryKey: ["bikes", "history", id],
        queryFn: () => bikeService.getBikeByIdForAll(id),
    })
}
