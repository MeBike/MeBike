import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { HTTP_STATUS } from "@/constants";
const getStatusBikeByIdAdmin = async (id: string) => {
    try {
        const response = await bikeService.getStatusBikeByIdAdmin(id);
        if (response.status === HTTP_STATUS.OK) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw new Error("Failed to fetch bike status by id");
    }
}
export const useGetStatusBikeIDQuery = (id: string) => {
    return useSuspenseQuery({
        queryKey: ["bikes", "status", id],
        queryFn: () => getStatusBikeByIdAdmin(id)
    })
}