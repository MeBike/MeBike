import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
export const useGetHistoryByIdQuery = (id: string) => {
    return useSuspenseQuery({
        queryKey: ["bikes", "history", id],
        queryFn: () => bikeService.getHistoryBikeById(id),
    })
}