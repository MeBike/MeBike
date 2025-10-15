import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";
export const useGetHistoryById = (id: string) => {
    return useQuery({
        queryKey: ["bikes", "history", id],
        queryFn: () => bikeService.getHistoryBikeById(id),
    })
}