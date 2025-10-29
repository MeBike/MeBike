import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useGetAllBikeQuery } from "./query/Bike/useGetAllBikeCus";
import { useCreateBikeMutation } from "./mutations/Bike/useCreateBike";
import type {
  BikeSchemaFormData,
  UpdateBikeSchemaFormData,
} from "@/schemas/bikeSchema";
import type { BikeStatus } from "@/types";
import { useUpdateBike } from "./mutations/Bike/useUpdateBike";
import { useSoftDeleteBikeMutation } from "./mutations/Bike/useSoftDeleteBike";
import { useReportBike } from "./mutations/Bike/useReportBike";
import { useGetBikeByIDAllQuery } from "./query/Bike/useGetBIkeByIDAll";
import { useGetStatisticsBikeQuery } from "./query/Bike/useGetStatusBike";
import { useRouter } from "next/navigation";
import { useGetStatusBikeIDQuery } from "./query/Bike/useGetStatusBikeByID";
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
export const useBikeActions = (
  hasToken: boolean,
  bikeId?: string,
  station_id?: string,
  supplier_id?: string,
  status?: BikeStatus,
  limit?: number,
  page?: number
) => {
  const router = useRouter();
  const {
    refetch: useGetAllRefetch,
    data,
    isFetching: isLoading,
  } = useGetAllBikeQuery({
    page: page,
    limit: limit,
    station_id: station_id || "",
    supplier_id: supplier_id || "",
    status: status,
  });
  const useCreateBike = useCreateBikeMutation();
  const updateBikeMutation = useUpdateBike();
  const {
    data: statisticData,
    refetch: refetchStatistics,
    isFetching: isLoadingStatistics,
  } = useGetStatisticsBikeQuery();
  const deleteBikeMutation = useSoftDeleteBikeMutation();
  const reportBikeMutation = useReportBike();
  const useGetDetailBike = useGetBikeByIDAllQuery(bikeId || "");
  const queryClient = useQueryClient();
  const getBikes = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    useGetAllRefetch();
  }, [useGetAllRefetch, hasToken, router]);
  const getStatisticsBike = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchStatistics();
  }, [refetchStatistics, hasToken, router]);
  const createBike = useCallback(
    (data: BikeSchemaFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useCreateBike.mutate(data, {
        onSuccess: (result) => {
          if (result.status === 201) {
            toast.success("Bike created successfully");
          } else {
            const errorMessage = result.data?.message || "Error creating bikes";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error creating bikes");
          toast.error(errorMessage);
        },
      });
    },
    [useCreateBike, hasToken, router]
  );
  const updateBike = useCallback(
    (data: UpdateBikeSchemaFormData, id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      updateBikeMutation.mutate(
        { id, data },
        {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success("Bike updated successfully");
            } else {
              const errorMessage =
                result.data?.message || "Error updating bikes";
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(error, "Error updating bikes");
            toast.error(errorMessage);
          },
        }
      );
    },
    [updateBikeMutation, hasToken, router]
  );
  const deleteBike = useCallback(
    (id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      deleteBikeMutation.mutate(id, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success("Bike deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["bikes"] });
          } else {
            const errorMessage = result.data?.message || "Error deleting bikes";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error deleting bikes");
          toast.error(errorMessage);
        },
      });
    },
    [deleteBikeMutation, hasToken, router, queryClient]
  );
  const reportBike = useCallback(
    (id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      reportBikeMutation.mutate(id, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success("Bike reported successfully");
          } else {
            const errorMessage = result.data?.message || "Error reporting bike";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error reporting bike");
          toast.error(errorMessage);
        },
      });
    },
    [reportBikeMutation, hasToken, router]
  );
  const getBikeByID = useCallback(() => {
    useGetDetailBike.refetch();
  }, [useGetDetailBike]);
  return {
    getBikes,
    createBike,
    updateBike,
    deleteBike,
    reportBike,
    getBikeByID,
    paginationBikes: data?.pagination,
    isFetchingBikeDetail: isLoading,
    isFetchingBike: useGetDetailBike.isFetching,
    isReportingBike: reportBikeMutation.isPending,
    isDeletingBike: deleteBikeMutation.isPending,
    isUpdatingBike: updateBikeMutation.isPending,
    isCreatingBike: useCreateBike.isPending,
    useGetAllBikeQuery,
    data: data,
    getStatisticsBike,
    isLoadingStatistics,
    statisticData,
    paginationOfBikes: data?.pagination,
  };
};
