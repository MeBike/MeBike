import { useQuery } from "@tanstack/react-query";
import { supplierService } from "@/services/supplier.service";
interface FetchAllSuppliersProps {
  page?: number;
  limit?: number;
  status?: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG" | "";
  search?: string;
}
const fetchAllSuppliers = async ({page, limit, status, search}: FetchAllSuppliersProps) => {
  try {
    const response = await supplierService.getAllSuppliers({
      page: page ?? 1,
      limit: limit ?? 10,
      status: status ?? "",
      search: search ?? "",
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch suppliers");
  }
};
export const useGetAllSupplierQuery = (page ?: number , limit ?:number , status?: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG" | "" , search?: string) => {
  return useQuery({
    queryKey: ["suppliers", "all" , page , limit , search, status],
    queryFn: () => fetchAllSuppliers({page,limit,search, status}),
  });
};
