import { useQuery } from "@tanstack/react-query";
import { supplierService } from "@/services/supplier.service";

const fetchSupplierStats = async () => {
  try {
    const response = await supplierService.statsSupplier();
    if(response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    throw error;
  }
};

export const useGetAllStatsSupplierQuery = () => {
  return useQuery({
    queryKey: ["supplier-stats"],
    queryFn: fetchSupplierStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure
  });
};