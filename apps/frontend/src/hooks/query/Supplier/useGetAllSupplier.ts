import { useQuery } from "@tanstack/react-query";
import { supplierService } from "@/services/supplier.service";

const fetchAllSuppliers = async ({
  page,
  pageSize,
  status,
  name,
}: {
  page?: number;
  pageSize?: number;
  status?: "ACTIVE" | "INACTIVE" | "TERMINATED" | "";
  name ?: string;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
    };
    if (status) query.status = status;
    if (name) query.name = name;
    const response = await supplierService.getAllSuppliers(query);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch suppliers");
  }
};
export const useGetAllSupplierQuery = ({
  page,
  pageSize,
  status,
  name,
}: {
  page?: number;
  pageSize?: number;
  status?: "ACTIVE" | "INACTIVE" | "TERMINATED" | "";
  name?:string,
}) => {
  return useQuery({
    queryKey: ["suppliers", "all",page,pageSize,status,name],
    queryFn: () => fetchAllSuppliers({page:page,pageSize:pageSize,status:status,name:name}),
    enabled:false,
  });
};
