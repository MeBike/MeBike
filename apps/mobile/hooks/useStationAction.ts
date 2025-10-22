import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllStation } from "./query/Station/useGetAllStationQuery";
import { useGetStationById } from "./query/Station/useGetStationByIDQuery";
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
export const useStationActions = (hasToken: boolean, stationId?: string) => {
  // const queryClient = useQueryClient();
  const { refetch, data: response, isLoading } = useGetAllStation();
  const {
    refetch: fetchingStationID,
    data: responseStationDetail,
    isLoading: isLoadingStationID,
  } = useGetStationById(stationId || "");
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
  return {
    getAllStations,
    getStationByID,
    refetch,
    stations: response ?? [],
    isLoadingGetAllStations: isLoading,
    fetchingStationID,
  responseStationDetail,
    isLoadingGetStationByID: isLoadingStationID,
  };
};
