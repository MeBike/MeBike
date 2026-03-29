import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { StationSchemaFormData } from "@schemas";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QUERY_KEYS , HTTP_STATUS } from "@constants";
import { useCreateStationMutation,useSoftDeleteStationMutation,useUpdateStationMutation} from "@mutations"
import {useGetNearestAvailableBike,useGetStationRevenue,useGetStationBikeRevenue,useGetStationStatsReservationQuery,useGetStationByIDQuery,useGetAllStation, useGetSelectStation} from "@queries";
import {getAxiosErrorCodeMessage , getErrorMessageFromStationCode} from "@utils";
import type { StationActionProps } from "@custom-types";
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
    data : selectedDataStation,
    isLoading : isLoadingGetSelectStation,
    refetch : refetchingGetSelectStation
  } = useGetSelectStation();
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
        if (result.status === HTTP_STATUS.CREATED) {
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
          if (result.status === HTTP_STATUS.OK) {
            toast.success(result.data?.message || "Đã xóa trạm thành công");
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.STATION.ALL(page, limit, name),
            });
          }
        },
        onError: (error) => {
          const code_error = getAxiosErrorCodeMessage(error);
          toast.error(getErrorMessageFromStationCode(code_error));
          throw error; 
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
      try {
        const result = await useUpdateStation.mutateAsync(data);
        if (result.status === HTTP_STATUS.OK) {
          toast.success(result.data?.message || "Đã cập nhật trạm thành công");
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
    selectedDataStation : selectedDataStation?.data || [],
    isLoadingGetSelectStation,
    refetchingGetSelectStation
  };
};
