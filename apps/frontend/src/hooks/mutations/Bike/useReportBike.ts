import { useMutation } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";
export const useReportBike = () => {
    return useMutation({
        mutationKey: ["bikes", "report"],
        mutationFn: (id : string) => bikeService.reportBrokenBike(id),
    })
}