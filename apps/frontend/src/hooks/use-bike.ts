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
import getAxiosErrorCodeMessage from "@/utils/error-util";
import { getErrorMessageFromBikeCode } from "@/utils/map-message";
export const useBikeActions = (
  hasToken: boolean,
  bike_detail_id?: string,
  stationId?: string,
  supplierId?: string,
  status?: BikeStatus,
  pageSize?: number,
  page?: number,
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
    pageSize: pageSize,
    stationId: stationId || "",
    supplierId: supplierId || "",
    status: status || "",
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
    async (data: BikeSchemaFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCreateBike.mutateAsync(data);
        if (result.status === 201) {
          toast.success("Tạo xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey: ["bikes","all"]
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromBikeCode(error_code));
      }
    },
    [
      useCreateBike,
      hasToken,
      router,
      page,
      pageSize,
      stationId,
      supplierId,
      status,
      queryClient,
    ],
  );
  const updateBike = useCallback(
    async (data: UpdateBikeSchemaFormData, id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await updateBikeMutation.mutateAsync({ id, data });
        if (result.status === 200) {
          toast.success("Cập nhật xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey:["bikes","all"]
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromBikeCode(error_code));
      }
    },
    [
      updateBikeMutation,
      hasToken,
      router,
      page,
      pageSize,
      stationId,
      supplierId,
      status,
      queryClient,
    ],
  );
  const deleteBike = useCallback(
    async (id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await deleteBikeMutation.mutateAsync(id);
        if (result.status === 200) {
          toast.success(result.data?.message || "Xóa xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey: ["bikes","all"]
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromBikeCode(error_code));
        throw error;
      }
    },
    [deleteBikeMutation, hasToken, router, queryClient],
  );
  const reportBike = useCallback(
    async (id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await reportBikeMutation.mutateAsync(id);
        if (result.status === 200) {
          toast.success(result.data?.message || "Báo cáo xe đạp thành công");
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromBikeCode(error_code));
        throw error;
      }
    },
    [reportBikeMutation, hasToken, router],
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
    detailBike: detailBike,
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
    bikeActivityStats: bikeActivityStats,
    getBikeActivityStats,
    isFetchingBikeActivityStats,
    getBikeStats,
    bikeStats: bikeStats,
    isFetchingBikeStats,
    bikeRentals: bikeRentals,
    getRentalBikes,
    isFetchingRentalBikes,
    totalRecord: data?.pagination.totalRecords || 0,
  };
};
