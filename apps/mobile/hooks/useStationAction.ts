import { useCallback } from "react";

import { useGetAllStation } from "./query/Station/useGetAllStationQuery";
import { useGetStationById } from "./query/Station/useGetStationByIDQuery";
import { useGetNearMeStations } from "./query/Station/useGetNearMeStationQuery";

type ErrorResponse = {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
};

type ErrorWithMessage = {
  message: string;
};

// const getErrorMessage = (error: unknown, defaultMessage: string): string => {
//   const axiosError = error as ErrorResponse;
//   if (axiosError?.response?.data) {
//     const { errors, message } = axiosError.response.data;
//     if (errors) {
//       const firstError = Object.values(errors)[0];
//       if (firstError?.msg) return firstError.msg;
//     }
//     if (message) return message;
//   }
//   const simpleError = error as ErrorWithMessage;
//   if (simpleError?.message) {
//     return simpleError.message;
//   }

//   return defaultMessage;
// };
export function useStationActions(hasToken: boolean, stationId?: string, latitude?: number, longitude?: number) {
  // const queryClient = useQueryClient();
  const { refetch, data: response, isLoading } = useGetAllStation();
  const {
    refetch: fetchingStationID,
    data: responseStationDetail,
    isLoading: isLoadingStationID,
  } = useGetStationById(stationId || "");
  const {
    refetch: refetchNearMe,
    data: nearMeStations,
    isLoading: isLoadingNearMe,
  } = useGetNearMeStations(latitude || 0, longitude || 0, false);
  const getAllStations = useCallback(async () => {
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

  const getNearbyStations = useCallback(async () => {
    if (!hasToken || !latitude || !longitude) {
      return;
    }
    refetchNearMe();
  }, [refetchNearMe, hasToken, latitude, longitude]);

  return {
    getAllStations,
    getStationByID,
    getNearbyStations,
    refetch,
    stations: response ?? [],
    nearbyStations: nearMeStations ?? [],
    isLoadingGetAllStations: isLoading,
    isLoadingNearbyStations: isLoadingNearMe,
    fetchingStationID,
    responseStationDetail,
    isLoadingGetStationByID: isLoadingStationID,
  };
}
