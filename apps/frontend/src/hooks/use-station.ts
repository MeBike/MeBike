import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllStation } from "./query/Station/useGetAllStationQuery";
import { useGetStationByIDQuery } from "./query/Station/useGetStationByIDQuery";
import { StationSchemaFormData } from "@/schemas/stationSchema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateStationMutation } from "./mutations/Station/useCreateStationQuery";
import { useSoftDeleteStationMutation } from "./mutations/Station/useSoftDeleteStationMutation";
import { useUpdateStationMutation } from "./mutations/Station/useUpdateStationQuery";
import { useGetStationStatsReservationQuery } from "./query/Station/useGetStationStatsReservation";
import { useGetStationBikeRevenue } from "./query/Station/useGetStationBikeRevenue";
import { useGetStationRevenue } from "./query/Station/useGetStationRevenue";
import { useGetNearestAvailableBike } from "./query/Station/useGetNearestAvailableBike";
import { QUERY_KEYS } from "@constants/queryKey";
import getErrorMessage from "@/utils/error-message";
import getAxiosErrorCodeMessage from "@/utils/error-util";
import {
  getErrorMessageFromStationCode,
  getErrorMessageUserFromCode,
} from "@/utils/map-message";
interface StationActionProps {
  hasToken?: boolean;
  stationId?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  name?: string;
  longitude?: number;
}
export const useStationActions = ({
  hasToken,
  stationId,
  page,
  limit,
  latitude,
  longitude,
  name,
}: StationActionProps) => {
  const queryClient = useQueryClient();
  const {
    data: responseStationReservationStats,
    refetch: refetchStationReservationStats,
  } = useGetStationStatsReservationQuery(stationId || "");
  const router = useRouter();
  const {
    refetch,
    data: response,
    isLoading,
  } = useGetAllStation({ page: page, limit: limit, name: name });
  const {
    refetch: fetchingStationID,
    data: responseStationDetail,
    isLoading: isLoadingStationID,
  } = useGetStationByIDQuery(stationId || "");
  const useCreateStation = useCreateStationMutation();
  const useSoftDeleteStation = useSoftDeleteStationMutation();
  const useUpdateStation = useUpdateStationMutation(stationId || "");
  const getReservationStats = useCallback(() => {
    if (!hasToken || !stationId) {
      return;
    }
    refetchStationReservationStats();
  }, [refetchStationReservationStats, hasToken, stationId]);
  const getAllStations = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetch();
  }, [refetch, hasToken]);
  const getStationByID = useCallback(() => {
    if (!hasToken) {
      return;
    }
    fetchingStationID();
  }, [fetchingStationID, hasToken]);
  const createStation = useCallback(
    async (data: StationSchemaFormData) => {
      if (!hasToken) {
        router.push("/auth/login");
        return;
      }
      try {
        const result = await useCreateStation.mutateAsync(data);
        if (result.status === 200) {
          toast.success(result.data?.message || "Đã tạo trạm thành công");
          queryClient.invalidateQueries({
            queryKey: ["stations", "all"],
          });
        }
        return result;
      } catch (error) {
        const code_error = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromStationCode(code_error));
        throw error; 
      }
    },
    [hasToken, router, queryClient, useCreateStation, page, limit, name],
  );
  const deleteStation = useCallback(
    async (stationId: string) => {
      if (!hasToken) {
        router.push("/auth/login");
        return;
      }
      useSoftDeleteStation.mutate(stationId, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success(result.data?.message || "Đã xóa trạm thành công");
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.STATION.ALL(page, limit, name),
            });
          } else {
            const errorMessage = result.data?.message || "Lỗi khi xóa trạm";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            "Error deleting stations",
          );
          toast.error(errorMessage);
        },
      });
    },
    [hasToken, router, queryClient, useSoftDeleteStation, page, limit, name],
  );
  const updateStation = useCallback(
    async (data: StationSchemaFormData) => {
      if (!hasToken) {
        router.push("/auth/login");
        return;
      }
      useUpdateStation.mutate(data, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success(
              result.data?.message || "Đã cập nhật trạm thành công",
            );
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.STATION.ALL(page, limit, name),
            });
          } else {
            const errorMessage =
              result.data?.message || "Lỗi khi cập nhật trạm";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Lỗi khi cập nhật trạm");
          toast.error(errorMessage);
        },
      });
    },
    [hasToken, router, queryClient, useUpdateStation, page, limit, name],
  );
  const {
    data: responseStationBikeRevenue,
    refetch: refetchStationBikeRevenue,
  } = useGetStationBikeRevenue();
  const getStationBikeRevenue = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchStationBikeRevenue();
  }, [refetchStationBikeRevenue, hasToken]);
  const { data: responseStationRevenue, refetch: refetchStationRevenue } =
    useGetStationRevenue();
  const getStationRevenue = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchStationRevenue();
  }, [refetchStationRevenue, hasToken]);
  const {
    data: responseNearestAvailableBike,
    refetch: refetchNearestAvailableBike,
  } = useGetNearestAvailableBike({
    latitude: latitude ?? 0,
    longitude: longitude ?? 0,
  });
  const getNearestAvailableBike = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchNearestAvailableBike();
  }, [refetchNearestAvailableBike, hasToken]);
  return {
    getAllStations,
    getStationByID,
    refetch,
    createStation,
    useGetAllStation,
    deleteStation,
    updateStation,
    stations: response?.data || [],
    paginationStations: response?.pagination,
    isLoadingGetAllStations: isLoading,
    fetchingStationID,
    responseStationDetail,
    isLoadingGetStationByID: isLoadingStationID,
    responseStationReservationStats,
    getReservationStats,
    responseStationBikeRevenue,
    getStationBikeRevenue,
    responseStationRevenue,
    getStationRevenue,
    responseNearestAvailableBike,
    getNearestAvailableBike,
  };
};
