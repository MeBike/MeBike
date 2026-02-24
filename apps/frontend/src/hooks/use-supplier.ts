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
import getErrorMessage from "@/utils/error-message";
import { SUPPLIER_MESSAGE } from "@/constants/messages";
import getAxiosErrorCodeMessage from "@/utils/error-util";
import { getErrorMessageFromSupplierCode } from "@/utils/map-message";
export const useSupplierActions = (hasToken: boolean , supplier_id ?: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    refetch: refetchAllSuppliers,
    data: allSupplier,
  } = useGetAllSupplierQuery();
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
      try {
        const result = await useCreateSupplier.mutateAsync(supplierData);
        if(result.status === 200){
          toast.success(SUPPLIER_MESSAGE.CREATE_SUCCESS);
          queryClient.invalidateQueries({ queryKey : ["suppliers", "all"]})
        }
        return result;
      } catch (error) {
        const code_error = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromSupplierCode(code_error));
        throw error; 
      }
    },
    [hasToken, router, queryClient, useCreateSupplier]
  );
  const changeStatusSupplier = useCallback(
    async (id: string, newStatus: "ACTIVE" | "INACTIVE" | "TERMINATED") => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useChangeStatusSupplier.mutate(
        { id, newStatus },
        {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success(SUPPLIER_MESSAGE.UPDATE_SUCCESS|| "Trạng thái nhà cung cấp đã được thay đổi thành công");
              queryClient.invalidateQueries({
                queryKey: ["suppliers", "all", 1, 10],
              });
              queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(
              error,
              "Error changing supplier status"
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
        if (result.status === 200) {
          toast.success(result.data?.message || "Cập nhật nhà cung cấp thành công");
          queryClient.invalidateQueries({
            queryKey: ["suppliers", "all", 1, 10],
          });
          queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
        } else {
          const errorMessage =
            result.data?.message || "Lỗi khi cập nhật nhà cung cấp";
          toast.error(errorMessage);
        }
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error, "Lỗi khi cập nhật nhà cung cấp");
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
    allSupplier,
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
    detailSupplier : detailSupplier,
    isLoadingDetailSupplier,
  };
};
