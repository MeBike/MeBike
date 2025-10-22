import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGetAllSupplierQuery } from "@hooks/query/Supplier/useGetAllSupplier";

export const useSupplierActions = (
    hasToken : boolean,
) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const {refetch : refetchAllSuppliers , data : allSupplier , isFetching : isFetchingAllSupplier} = useGetAllSupplierQuery();
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
      isLoadingGetAllSuppliers: isFetchingAllSupplier,
    };
}