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
import { useGetBikeActivityStatsQuery } from "./query/Bike/useGetBikeActivityStatsQuery";
import { useGetBikeStatsQuery } from "./query/Bike/useGetStatsBikeQuery";
import { useGetRentalBikeQuery } from "./query/Bike/useGetRentalBikeQuery";
import { QUERY_KEYS , HTTP_STATUS , MESSAGE } from "@constants/index"
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
  bike_detail_id?: string,
  station_id?: string,
  supplier_id?: string,
  status?: BikeStatus,
  limit?: number,
  page?: number
) => {
  const router = useRouter();
  const {
    data: bikeActivityStats,
    refetch: refetchGetBikeActivityStats,
    isFetching: isFetchingBikeActivityStats,
  } = useGetBikeActivityStatsQuery(bike_detail_id || "");
  const {
    data: bikeStats,
    refetch: refetchStatisticsBike,
    isFetching: isFetchingBikeStats,
  } = useGetBikeStatsQuery(bike_detail_id || "");
  const {
    data: bikeRentals,
    refetch: refetchRentalBike,
    isFetching: isFetchingRentalBikes,
  } = useGetRentalBikeQuery(bike_detail_id || "");
  const getRentalBikes = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    if (bike_detail_id) {
      refetchRentalBike();
    }
  }, [refetchRentalBike, bike_detail_id, hasToken, router]);
  const getBikeActivityStats = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    if (bike_detail_id) {
      refetchGetBikeActivityStats();
    }
  }, [refetchGetBikeActivityStats, bike_detail_id, hasToken, router]);
  const getBikeStats = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    if (bike_detail_id) {
      refetchStatisticsBike();
    }
  }, [refetchStatisticsBike, bike_detail_id, hasToken, router]);
  const {
    refetch: fetchBike,
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
    data: 
    statisticData,
    refetch: refetchStatistics,
    isFetching: isLoadingStatistics,
  } = useGetStatisticsBikeQuery();
  const deleteBikeMutation = useSoftDeleteBikeMutation();
  const reportBikeMutation = useReportBike();
  const {
    data: detailBike,
    refetch: getDetailBike,
    isFetching: isLoadingDetail,
  } = useGetBikeByIDAllQuery(bike_detail_id || "");
  const queryClient = useQueryClient();
  const getBikes = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    fetchBike();
  }, [hasToken, router, fetchBike]);
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
        onSuccess: (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === HTTP_STATUS.CREATED) {
            toast.success(result.data?.message || MESSAGE.CREATE_BIKE_SUCCESS);
            queryClient.invalidateQueries({
              queryKey:QUERY_KEYS.BIKE.ALL()
            });
          } else {
            const errorMessage = result.data?.message || MESSAGE.CREATE_BIKE_FAILED;
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, MESSAGE.CREATE_BIKE_FAILED);
          toast.error(errorMessage);
        },
      });
    },
    [
      useCreateBike,
      hasToken,
      router,
      page,
      limit,
      station_id,
      supplier_id,
      status,
      queryClient,
    ]
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
          onSuccess: (result: {
            status: number;
            data?: { message?: string };
          }) => {
            if (result.status === HTTP_STATUS.OK) {
              toast.success(result.data?.message || MESSAGE.UPDATE_BIKE_SUCCESS);
              queryClient.invalidateQueries({
                queryKey:QUERY_KEYS.BIKE.ALL(page, limit, status, station_id, supplier_id)
              });
            } else {
              const errorMessage =
                result.data?.message || MESSAGE.UPDATE_BIKE_FAILED;
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(error, MESSAGE.UPDATE_BIKE_FAILED);
            toast.error(errorMessage);
          },
        }
      );
    },
    [
      updateBikeMutation,
      hasToken,
      router,
      page,
      limit,
      station_id,
      supplier_id,
      status,
      queryClient,
    ]
  );
  const deleteBike = useCallback(
    (id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      deleteBikeMutation.mutate(id, {
        onSuccess: (result) => {
          if (result.status === HTTP_STATUS.OK) {
            toast.success(result.data?.message || MESSAGE.DELETE_BIKE_SUCCESS);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BIKE.ALL() });
          } else {
            const errorMessage = result.data?.message || MESSAGE.DELETE_BIKE_FAILED;
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, MESSAGE.DELETE_BIKE_FAILED);
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
          if (result.status === HTTP_STATUS.OK) {
            toast.success(result.data?.message || MESSAGE.REPORT_BIKE_SUCCESS);
          } else {
            const errorMessage = result.data?.message || MESSAGE.REPORT_BIKE_FAILED;
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, MESSAGE.REPORT_BIKE_FAILED);
          toast.error(errorMessage);
        },
      });
    },
    [reportBikeMutation, hasToken, router]
  );
  const getBikeByID = useCallback(() => {
    if (bike_detail_id) {
      getDetailBike();
    }
  }, [getDetailBike, bike_detail_id]);
  return {
    getBikes,
    createBike,
    updateBike,
    deleteBike,
    reportBike,
    getBikeByID,
    paginationBikes: data?.pagination,
    isFetchingBikeDetail: isLoading,
    isLoadingDetail,
    detailBike: detailBike?.result,
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
    bikeActivityStats: bikeActivityStats?.result,
    getBikeActivityStats,
    isFetchingBikeActivityStats,
    getBikeStats,
    bikeStats: bikeStats?.result,
    isFetchingBikeStats,
    bikeRentals: bikeRentals?.result.data,
    getRentalBikes,
    isFetchingRentalBikes,
    totalRecord: data?.pagination.totalRecords || 0,
  };
};
