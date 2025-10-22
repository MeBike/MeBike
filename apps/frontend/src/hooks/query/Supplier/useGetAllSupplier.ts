import { useQuery } from "@tanstack/react-query";
import { supplierService } from "@/services/supplier.service";

const fetchAllSuppliers = async (
  page?: number,
  limit?: number,
  status?: "HOẠT ĐÔNG" | "NGƯNG HOẠT ĐỘNG" | ""
) => {
  try {
    const response = await supplierService.getAllSuppliers({
      page: page ?? 1,
      limit: limit ?? 100,
      status: status ?? "",
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    throw new Error("Failed to fetch suppliers");
  }
};
export const useGetAllSupplierQuery = (page ?: number , limit ?:number , status?: "HOẠT ĐÔNG" | "NGƯNG HOẠT ĐỘNG" | "") => {
  return useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => fetchAllSuppliers(page, limit, status),
  });
};
