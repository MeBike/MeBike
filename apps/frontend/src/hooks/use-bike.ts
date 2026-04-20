import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useGetAllBikeQuery } from "./query/Bike/useGetAllBikeCus";
import { useCreateBikeMutation } from "./mutations/Bike/useCreateBike";
import type { BikeSchemaFormData, UpdateBikeSchemaFormData } from "@schemas";
import type { BikeStatus, BikeActionProps } from "@custom-types";
import {
  useReportBike,
  useSoftDeleteBikeMutation,
  useTechnicianUpdateBikeStatus,
  useUpdateBike,
  useUpdateBikeStatus,
} from "@mutations";
import { useRouter } from "next/navigation";
import {
  useGetBikeStatsQuery,
  useGetBikeActivityStatsQuery,
  useGetBikeByIDAllQuery,
  useGetRentalBikeQuery,
  useGetStatusCountQuery,
  useGetHistoryByIdQuery,
  useGetStatisticsBikeQuery,
  useGetBikeInMyStationQuery,
  useGetBikeDetailInMyStationQuery,
} from "@queries";
import { HTTP_STATUS } from "@constants";
import { getErrorMessageFromBikeCode, getAxiosErrorCodeMessage } from "@utils";
export const useBikeActions = ({
  hasToken,
  bike_detail_id,
  stationId,
  supplierId,
  status,
  pageSize,
  page,
}: BikeActionProps) => {
  const router = useRouter();
  const {
    data: bikeHistory,
    refetch: refetchGetBikeHistory,
    isLoading: isLoadingGetBikeHistory,
  } = useGetHistoryByIdQuery(bike_detail_id || "");
  const getHistoryBike = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetBikeHistory();
  }, [refetchGetBikeHistory, hasToken, router]);
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
    refetchRentalBike();
  }, [hasToken, router]);
  const getBikeActivityStats = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetBikeActivityStats();
  }, [hasToken, router]);
  const getBikeStats = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchStatusCount();
  }, [bike_detail_id, hasToken, router]);
  const {
    refetch: fetchBike,
    data,
    isFetching: isLoading,
    isLoading: isLoadingBikes,
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
    data: statusCount,
    refetch: refetchStatusCount,
    isFetching: isLoadingStatusCount,
  } = useGetStatusCountQuery();
  const deleteBikeMutation = useSoftDeleteBikeMutation();
  const reportBikeMutation = useReportBike();
  const useUpdateBikeStatusMutation = useUpdateBikeStatus();
  const useTechnicianUpdateBike = useTechnicianUpdateBikeStatus();
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
    refetchStatusCount();
  }, [refetchStatusCount, hasToken, router]);
  const createBike = useCallback(
    async (data: BikeSchemaFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCreateBike.mutateAsync(data);
        if (result.status === HTTP_STATUS.CREATED) {
          toast.success("Tạo xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey: ["bikes", "all"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromBikeCode(error_code));
        throw error;
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
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Cập nhật xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey: ["bikes", "all"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromBikeCode(error_code));
        throw error;
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
  const updateBikeStatus = useCallback(
    async (id: string, status: "AVAILABLE" | "BROKEN") => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useUpdateBikeStatusMutation.mutateAsync({ id, status });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Cập nhật trạng thái xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey: ["bikes", "all"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromBikeCode(error_code));
        throw error;
      }
    },
    [
      useUpdateBikeStatusMutation,
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
  const technicianUpdateBikeStatus = useCallback(
    async (id: string, status: "AVAILABLE" | "BROKEN") => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useTechnicianUpdateBike.mutateAsync({ id, status });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Cập nhật trạng thái xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey: ["bikes", "all"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromBikeCode(error_code));
        throw error;
      }
    },
    [
      useUpdateBikeStatusMutation,
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
        if (result.status === HTTP_STATUS.OK) {
          toast.success(result.data?.message || "Xóa xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey: ["bikes", "all"],
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
        if (result.status === HTTP_STATUS.OK) {
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
  const {
    data: statisticsBike,
    refetch: refetchStatisticBike,
    isLoading: isLoadingStatisticsBike,
  } = useGetStatisticsBikeQuery(bike_detail_id || "");
  const getStatsBike = useCallback(() => {
    refetchStatisticBike();
  }, [bike_detail_id]);
  const {
    data: myBikeInStation,
    refetch: refetchMyBikeInStation,
    isLoading: isLoadingMyBikeInStation,
  } = useGetBikeInMyStationQuery({ page: page, pageSize: pageSize, status: status || "" });
  const getMyBikeInStation = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchMyBikeInStation();
  }, [refetchMyBikeInStation, hasToken, page, pageSize]);
  const {
    data: myBikeInStationDetail,
    refetch: refetchMyBikeInStationDetail,
    isLoading: isLoadingMyBikeInStationDetail,
  } = useGetBikeDetailInMyStationQuery(bike_detail_id || "");
  const getMyBikeInStationDetail = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchMyBikeInStationDetail();
  }, [refetchMyBikeInStationDetail, hasToken, stationId]);
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
    isLoadingStatusCount,
    statusCount,
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
    isLoadingBikes,
    getHistoryBike,
    bikeHistory: bikeHistory,
    isLoadingGetBikeHistory,
    statisticsBike,
    getStatsBike,
    isLoadingStatisticsBike,
    myBikeInStation,
    isLoadingMyBikeInStation,
    isLoadingMyBikeInStationDetail,
    myBikeInStationDetail,
    getMyBikeInStation,
    getMyBikeInStationDetail,
    updateBikeStatus,
    isUpdateStatusBike : useUpdateBikeStatusMutation.isPending,
    technicianUpdateBikeStatus,
    isTechnicianUpdateStatusBike : useTechnicianUpdateBike.isPending,
  };
};
