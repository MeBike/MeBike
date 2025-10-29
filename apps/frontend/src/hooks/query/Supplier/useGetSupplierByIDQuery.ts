import { useQuery } from "@tanstack/react-query";
import { supplierService } from "@/services/supplier.service";

const fetchDetailSupplierByID = async (id: string) => {
  try {
    const response = await supplierService.getSupplierById(id);
    if(response.status === 200) {
      return response.data;
    } else {
      throw new Error("Failed to fetch supplier details");
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch supplier details");
  }
};
export const useGetSupplierByIDQuery = (id: string) => {
  return useQuery({
    queryKey: ["supplier", id],
    queryFn: () => {
        return fetchDetailSupplierByID(id);
    },
    enabled: !!id,
  });
};
