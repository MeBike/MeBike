import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";
export const useGetAllBike = () => {
    return useQuery({
        queryKey: ["bikes", "all"],
        queryFn: () => bikeService.getAllBikes(),
    })
}