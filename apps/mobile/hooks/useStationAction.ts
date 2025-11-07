import { useCallback, useState } from "react";

import { useGetAllStation } from "./query/Station/useGetAllStationQuery";
import { useGetNearMeStations } from "./query/Station/useGetNearMeStationQuery";
import { useGetStationById } from "./query/Station/useGetStationByIDQuery";

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
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const {
    data: nearMeStations,
    isLoading: isLoadingNearMe,
  } = useGetNearMeStations(
    nearbyCoords?.lat || 0,
    nearbyCoords?.lng || 0,
    nearbyCoords !== null,
  );
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

  const getNearbyStations = useCallback(async (lat?: number, lng?: number) => {
    if (!hasToken) {
      return;
    }
    if (lat && lng) {
      setNearbyCoords({ lat, lng });
    }
    else if (latitude && longitude) {
      setNearbyCoords({ lat: latitude, lng: longitude });
    }
  }, [hasToken, latitude, longitude]);

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
