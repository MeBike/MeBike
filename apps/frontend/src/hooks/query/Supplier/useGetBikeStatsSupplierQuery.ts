import { useQuery } from "@tanstack/react-query";
import { supplierService } from "@/services/supplier.service";

const fetchBikeStatsSupplier = async (supplierId: string) => {
  try {
    const response = await supplierService.statsSupplierBike(supplierId);
    if(response.status === 200) {
        return response.data;
    }
  } catch (error) {
    console.log(error)
    throw new Error("Failed to fetch bike stats");
  }
}
export const useGetBikeStatsSupplierQuery = (supplierId?: string) => {
    return useQuery({
      queryKey: ["suppliers", "detail", supplierId],
      queryFn: () => fetchBikeStatsSupplier(supplierId as string),
      enabled: !!supplierId,
    });   
};