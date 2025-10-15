import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useGetAllBike } from "./query/Bike/useGetAllBikeCus";
import { bikeService } from "@/services/bikeService";
import { useCreateBikeMutation } from "./mutations/Bike/useCreateBike";
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
export const useBikeActions = (setHasToken: React.Dispatch<React.SetStateAction<boolean>>) => {
    const useGetBikes = useGetAllBike();
    const useCreateBike = useCreateBikeMutation();
    const queryClient = useQueryClient();
    const getBikes = useCallback(() => {
        useGetBikes.refetch();
    }, [useGetBikes]);
    return {
        useGetBikes,
        queryClient,
      
    };
}