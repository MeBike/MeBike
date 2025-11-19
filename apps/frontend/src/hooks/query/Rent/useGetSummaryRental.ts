import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@/services/rental.service";

const getSummaryRental = async () => {
    try {
        const response = await rentalService.getSummaryRental();
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.error("Error fetching summary rental data:", error);
        throw error;
    }
};

export const useGetSummaryRentalQuery = () => {
    return useQuery({
        queryKey: ["summary-rental"],
        queryFn: getSummaryRental,
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: false,
    });
};