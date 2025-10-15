import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";

export const useGetAllBikeQuery = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ["bikes", "all", page, limit],
        queryFn: ({ queryKey }) => {
            const [, , pageParam, limitParam] = queryKey;
            return bikeService.getAllBikes(pageParam as number, limitParam as number);
        },
    });
};