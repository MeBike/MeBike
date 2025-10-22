import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGetAllSupplierQuery } from "@hooks/query/Supplier/useGetAllSupplier";
import { useGetAllStatsSupplierQuery } from "./query/Supplier/useGetAllStatsSupplier";
import { useCreateSupplierMutation } from "./mutations/Supplier/useCreateSupplierMutation";
import { CreateSupplierSchema } from "@/schemas/supplier.schema";
import { toast } from "sonner";
import { useGetBikeStatsSupplierQuery } from "./query/Supplier/useGetBikeStatsSupplierQuery";

interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
}

interface ErrorWithMessage {
  message: string;
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const { errors, message } = axiosError.response.data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg) return firstError.msg;
    }
    if (message) return message;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }

  return defaultMessage;
};
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
          if (result.status === 200) {
            toast.success("Supplier created successfully");
            queryClient.invalidateQueries({
              queryKey: ["suppliers", "all", 1, 10],
            });
            queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
          } else {
            const errorMessage =
              result.data?.message || "Error creating suppliers";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error creating bikes");
          toast.error(errorMessage);
        },
      });
    },
    [hasToken, router, queryClient, useCreateSupplier]
  );
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
    isLoadingGetAllStatsSupplier: isLoadingAllStatsSupplier,
    getAllStatsSupplier,
    allStatsSupplier,
  };
};
