import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { HTTP_STATUS } from "@/constants";
const getBikeByIDForAll = async (id: string) => {
    try {
        const response = await bikeService.getDetailBike(id);
        if (response.status === HTTP_STATUS.OK) {
            return response.data;
        }
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch bike details");
    }
};
export const useGetBikeByIDAllQuery = (id: string) => {
    return useSuspenseQuery({
        queryKey: ["bikes", "detail", id],
        queryFn: () => getBikeByIDForAll(id),
    })
}
