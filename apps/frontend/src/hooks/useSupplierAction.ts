import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGetAllSupplierQuery } from "@hooks/query/Supplier/useGetAllSupplier";
import { useGetAllStatsSupplierQuery } from "./query/Supplier/useGetAllStatsSupplier";
export const useSupplierActions = (
    hasToken : boolean,
) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const {refetch : refetchAllSuppliers , data : allSupplier , isFetching : isFetchingAllSupplier} = useGetAllSupplierQuery();
    const {data: allStatsSupplier, isLoading: isLoadingAllStatsSupplier} = useGetAllStatsSupplierQuery();
    const getAllSuppliers = useCallback(() => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      refetchAllSuppliers();
    }, [refetchAllSuppliers, hasToken, router]);
    
    
    return {
      useGetAllSupplierQuery,
      getAllSuppliers,
      allSupplier,
      useGetAllStatsSupplierQuery,
      isLoadingGetAllStatsSupplier: isLoadingAllStatsSupplier,
    };
}