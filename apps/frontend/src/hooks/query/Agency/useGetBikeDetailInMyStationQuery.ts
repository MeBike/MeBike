import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
const getBikeDetailInMyStation = async (id: string) => {
    try {
        const response = await agencyService.getBikeDetailInMyStation(id);
        if (response.status === HTTP_STATUS.OK) {
            return response.data;
        }
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch bike details");
    }
};
export const useGetBikeDetailInMyStationAgencyQuery = (id: string) => {
    return useQuery({
        queryKey: ["my","bike-detail","agency",id],
        queryFn: () => getBikeDetailInMyStation(id),
        enabled: !!id,
    })
}
