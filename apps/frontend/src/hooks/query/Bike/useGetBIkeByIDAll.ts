import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
export const useGetBikeByIDAllQuery = (id: string) => {
    return useQuery({
        queryKey: ["bikes", "detail", id],
        queryFn: () => bikeService.getBikeByIdForAll(id),
    })
}
