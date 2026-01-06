import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { HTTP_STATUS } from "@/constants";

const getHistoryBikeById = async (id: string) => {
    try {
        const response = await bikeService.getHistoryBikeById(id);
        if (response.status === HTTP_STATUS.OK) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw new Error("Failed to fetch history bike by id");
    }
}
export const useGetHistoryByIdQuery = (id: string) => {
    return useSuspenseQuery({
        queryKey: ["bikes", "history", id],
        queryFn: () => getHistoryBikeById(id),
    })
}