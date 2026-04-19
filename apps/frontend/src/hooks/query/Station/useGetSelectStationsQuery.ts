import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { HTTP_STATUS } from "@/constants";
const fetchSelectStaions = async () => {
    try {
        const response = await stationService.getSelectStations();
        if(response.status === HTTP_STATUS.OK){
            return response.data
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const useGetSelectStation = () => {
    return useQuery({
        queryKey : ["select","stations"],
        queryFn : () => fetchSelectStaions(),
        enabled:false,
    });
}