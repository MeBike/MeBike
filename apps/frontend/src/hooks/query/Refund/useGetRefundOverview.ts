import { refundService } from "@/services/refund.service";
import { useQuery } from "@tanstack/react-query";

const fetchRefundOverview = async () => {
    try {
        const response = await refundService.getRefundOverview();
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const useGetRefundOverview = () => {
    return useQuery({
        queryKey: ["refundOverview"],
        queryFn: fetchRefundOverview,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};