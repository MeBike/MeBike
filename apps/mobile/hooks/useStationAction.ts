import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllStation } from "./query/Station/useGetAllStationQuery";

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
export const useStationActions = (
  hasToken : boolean, 
  stationId?: string
) => {

    const queryClient = useQueryClient();
    const useGetAllStations = useGetAllStation();
    const getAllStations = useCallback(() => {
        if(!hasToken){  
           
            return;
        };
        useGetAllStations.refetch();
    }, [useGetAllStations, hasToken, ]);
    
    
    return {
        getAllStations,
        isLoadingGetAllStations: useGetAllStations.isLoading,
    };
}