import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllStation } from "./query/Station/useGetAllStationQuery";
import { useGetStationByIDQuery } from "./query/Station/useGetStationByIDQuery";
import { StationSchemaFormData } from "@/schemas/stationSchema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateSupplierMutation } from "./mutations/Station/useCreateStationQuery";
import { useSoftDeleteStationMutation } from "./mutations/Station/useSoftDeleteStationMutation";
import { useUpdateStationMutation } from "./mutations/Station/useUpdateStationQuery";
import { useGetStationStatsReservationQuery } from "./query/Station/useGetStationStatsReservation";
import { useGetStationBikeRevenue } from "./query/Station/useGetStationBikeRevenue";
import { useGetStationRevenue } from "./query/Station/useGetStationRevenue";
import { useGetNearestAvailableBike } from "./query/Station/useGetNearestAvailableBike";
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
  name
}: StationActionProps) => {
  const queryClient = useQueryClient();
  const { data: responseStationReservationStats , refetch : refetchStationReservationStats } = useGetStationStatsReservationQuery(stationId || "");
  const router = useRouter();
  const {
    refetch,
    data: response,
    isLoading,
  } = useGetAllStation({ page: page, limit: limit , name: name });
  const {
    refetch: fetchingStationID,
    data: responseStationDetail,
    isLoading: isLoadingStationID,
  } = useGetStationByIDQuery(stationId || "");
  const useCreateStation = useCreateSupplierMutation();
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
      useCreateStation.mutate(data, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success("Station created successfully");
            queryClient.invalidateQueries({
              queryKey: ["stations", "all"],
            });
            queryClient.invalidateQueries({ queryKey: ["station-stats"] });
          } else {
            const errorMessage =
              result.data?.message || "Error creating stations";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error creating bikes");
          toast.error(errorMessage);
        },
      });
    },
    [hasToken, router, queryClient, useCreateStation]
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
            toast.success("Station deleted successfully");
            queryClient.invalidateQueries({
              queryKey: ["stations", "all"],
            });
            queryClient.invalidateQueries({ queryKey: ["station-stats"] });
          } else {
            const errorMessage =
              result.data?.message || "Error deleting stations";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            "Error deleting stations"
          );
          toast.error(errorMessage);
        },
      });
    },
    [hasToken, router, queryClient, useSoftDeleteStation]
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
            toast.success("Station updated successfully");
            queryClient.invalidateQueries({
              queryKey: ["stations", "all"],
            });
            queryClient.invalidateQueries({ queryKey: ["station-stats"] });
          } else {
            const errorMessage =
              result.data?.message || "Error updating stations";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error updating stations");
          toast.error(errorMessage);
        },
      });
    },
    [hasToken, router, queryClient, useUpdateStation]
  );
  const { data: responseStationBikeRevenue, refetch: refetchStationBikeRevenue } = useGetStationBikeRevenue();
  const getStationBikeRevenue = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchStationBikeRevenue();
  }, [refetchStationBikeRevenue, hasToken]);
  const {data : responseStationRevenue , refetch : refetchStationRevenue } = useGetStationRevenue();
  const getStationRevenue = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchStationRevenue();
  }, [refetchStationRevenue, hasToken]);
  const { data : responseNearestAvailableBike , refetch : refetchNearestAvailableBike} = useGetNearestAvailableBike({
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
