import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGetAllSupplierQuery } from "@hooks/query/Supplier/useGetAllSupplier";
import { useGetAllStatsSupplierQuery } from "./query/Supplier/useGetAllStatsSupplier";
import { useCreateSupplierMutation } from "./mutations/Supplier/useCreateSupplierMutation";
import { CreateSupplierSchema } from "@/schemas/supplier.schema";
import { toast } from "sonner";
import { useGetBikeStatsSupplierQuery } from "./query/Supplier/useGetBikeStatsSupplierQuery";
import { useChangeStatusSupplierMutation } from "./mutations/Supplier/useChangeStatusSupplierMutation";
import { useUpdateSupplierMutation } from "./mutations/Supplier/useUpdateSupplierMutation";
import { useGetSupplierByIDQuery } from "./query/Supplier/useGetSupplierByIDQuery";
import { HTTP_STATUS , MESSAGE , QUERY_KEYS } from "@constants/index";
import { getErrorMessage } from "@/utils/message";
interface SupplierActionProps {
  hasToken : boolean,
  supplier_id ?: string,
  limit ?: number,
  page ?: number,
  search ?: string
}
export const useSupplierActions = ({hasToken , supplier_id , limit , page, search}: SupplierActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    refetch: refetchAllSuppliers,
    data: allSupplier,
    isLoading:isLoadingAllSupplier
  } = useGetAllSupplierQuery(page, limit, "", search);
  const { data: allStatsSupplier, isLoading: isLoadingAllStatsSupplier , refetch : fetchAllStatsSupplier } =
    useGetAllStatsSupplierQuery();
  const useCreateSupplier = useCreateSupplierMutation();
  const useUpdateSupplier = useUpdateSupplierMutation();
  const {data : detailSupplier , isLoading: isLoadingDetailSupplier , refetch : fetchDetailSupplier} = useGetSupplierByIDQuery(supplier_id || "");
  const useChangeStatusSupplier = useChangeStatusSupplierMutation();
  const { data: bikeStats, refetch: fetchBikeStatsSupplier , isLoading: isLoadingBikeStatsSupplier } =
    useGetBikeStatsSupplierQuery(supplier_id);
  const getAllSuppliers = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAllSuppliers();
  }, [refetchAllSuppliers, hasToken, router]);
  const getAllStatsSupplier = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    fetchAllStatsSupplier();
  }, [hasToken, router, fetchAllStatsSupplier]);
  const createSupplier = useCallback(
    async (supplierData: CreateSupplierSchema) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useCreateSupplier.mutate(supplierData, {
        onSuccess: (result) => {
          if (result.status === HTTP_STATUS.OK) {
            toast.success(result.data?.data?.CreateSupplier.message || MESSAGE.CREATE_SUPPLIER_SUCCESS );
            queryClient.invalidateQueries({
              queryKey: ["suppliers", "all"],
            });
            queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, MESSAGE.CREATE_SUPPLIER_FAILED);
          toast.error(errorMessage);
        },
      });
    },
    [hasToken, router, queryClient, useCreateSupplier]
  );
  const changeStatusSupplier = useCallback(
    async (id: string, newStatus: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG") => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useChangeStatusSupplier.mutate(
        { id, newStatus },
        {
          onSuccess: (result) => {
            if (result.status === HTTP_STATUS.OK) {
              toast.success(result.data?.message || MESSAGE.CHANGE_STATUS_SUPPLIER_SUCCESS);
              queryClient.invalidateQueries({
                queryKey: ["suppliers", "all"],
              });
              queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
            } else {
              const errorMessage =
                result.data?.message || MESSAGE.CHANGE_STATUS_SUPPLIER_FAILED;
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.CHANGE_STATUS_SUPPLIER_FAILED
            );
            toast.error(errorMessage);
          },
        }
      );
    },
    [hasToken, router, queryClient, useChangeStatusSupplier]
  );
  const getUpdateSupplier = useCallback(({ data, id }: { data: Partial<CreateSupplierSchema>; id: string }) => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    useUpdateSupplier.mutate({ id: id, data }, {
      onSuccess: (result) => {
        if (result.status === HTTP_STATUS.OK) {
          toast.success(result.data?.data?.UpdateSupplier.message || MESSAGE.UPDATE_SUPPLIER_SUCCESS);
          queryClient.invalidateQueries({
            queryKey: ["suppliers", "all"],
          });
          queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
          queryClient.invalidateQueries({ queryKey: ["supplier", id] });
        }
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error, MESSAGE.UPDATE_SUPPLIER_FAILED);
        toast.error(errorMessage);
      },
    });
  }, [hasToken, router, queryClient, useUpdateSupplier]);
  const getBikeStatsSupplier = useCallback(async () => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    const result = await fetchBikeStatsSupplier();
    console.log("Fetched Data:", result.data);
  }, [hasToken, router, fetchBikeStatsSupplier]);

  return {
    useGetAllSupplierQuery,
    getAllSuppliers,
    allSupplier : allSupplier?.data?.Suppliers.data,
    paginationAllSupplier: allSupplier?.data?.Suppliers.pagination,
    isLoadingAllSupplier,
    createSupplier,
    isCreatingSupplier: useCreateSupplier.isPending,
    useGetAllStatsSupplierQuery,
    useGetBikeStatsSupplierQuery,
    getBikeStatsSupplier,
    bikeStats,
    isLoadingBikeStatsSupplier,
    isLoadingAllStatsSupplier,
    getAllStatsSupplier,
    allStatsSupplier,
    changeStatusSupplier,
    getUpdateSupplier,
    fetchDetailSupplier,
    detailSupplier : detailSupplier?.data?.Supplier.data,
    isLoadingDetailSupplier,
  };
};
