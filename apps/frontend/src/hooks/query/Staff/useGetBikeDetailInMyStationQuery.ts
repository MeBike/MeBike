import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { HTTP_STATUS } from "@/constants";
const getBikeDetailInMyStation = async (id: string) => {
    try {
        const response = await bikeService.getBikeDetailInMyStation(id);
        if (response.status === HTTP_STATUS.OK) {
            return response.data;
        }
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch bike details");
    }
};
export const useGetBikeDetailInMyStationQuery = (id: string) => {
    return useQuery({
        queryKey: ["my","bike-detail",id],
        queryFn: () => getBikeDetailInMyStation(id),
        enabled: !!id,
    })
}
