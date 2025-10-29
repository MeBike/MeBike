import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import type {
  BikeSchemaFormData,
  UpdateBikeSchemaFormData,
} from "@schemas/bikeSchema";

import { useCreateBikeMutation } from "./mutations/Bike/useCreateBike";
import { useReportBike } from "./mutations/Bike/useReportBike";
import { useSoftDeleteBikeMutation } from "./mutations/Bike/useSoftDeleteBike";
import { useUpdateBike } from "./mutations/Bike/useUpdateBike";
import { useGetAllBikeQuery } from "./query/Bike/useGetAllBikeCus";
import { useGetBikeByIDAllQuery } from "./query/Bike/useGetBIkeByIDAll";

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

function getErrorMessage(error: unknown, defaultMessage: string): string {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const { errors, message } = axiosError.response.data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg)
        return firstError.msg;
    }
    if (message)
      return message;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }

  return defaultMessage;
}
type BikeActionsProps = {
  hasToken: boolean;
  bike_id?: string;
  station_id?: string;
  page?: number;
  limit?: number;
};
export function useBikeActions({hasToken , bike_id , station_id , page , limit} : BikeActionsProps) {
  const navigation = useNavigation();
  const {
    refetch: useGetBikes,
    data: allBikesResponse,
    isFetching: isFetchingAllBikes,
  } = useGetAllBikeQuery({ page : page || 1, limit : limit || 20, station_id });

  // Extract data and pagination from the response
  const allBikes = allBikesResponse?.data || [];
  const totalRecords = allBikesResponse?.pagination?.totalRecords || 0;
  const useCreateBike = useCreateBikeMutation();
  const updateBikeMutation = useUpdateBike();
  const deleteBikeMutation = useSoftDeleteBikeMutation();
  const reportBikeMutation = useReportBike();
  const {
    refetch: useGetDetailBike,
    data: detailBike,
    isFetching: isFetchingBikeDetail,
  } = useGetBikeByIDAllQuery(bike_id || "");
  const queryClient = useQueryClient();
  const getBikes = useCallback(() => {
    if (!hasToken) {
      navigation.navigate("Login" as never);
      return;
    }
    useGetBikes();
  }, [useGetBikes, hasToken, navigation, station_id]);
  const createBike = useCallback(
    (data: BikeSchemaFormData) => {
      if (!hasToken) {
        navigation.navigate("Login" as never);
        return;
      }
      useCreateBike.mutate(data, {
        onSuccess: (result) => {
          if (result.status === 201) {
            toast.success("Bike created successfully");
          }
          else {
            const errorMessage = result.data?.message || "Error creating bikes";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error creating bikes");
          toast.error(errorMessage);
        },
      });
    },
    [useCreateBike, hasToken, navigation],
  );
  const updateBike = useCallback(
    (data: UpdateBikeSchemaFormData, id: string) => {
      if (!hasToken) {
        navigation.navigate("Login" as never);
        return;
      }
      updateBikeMutation.mutate(
        { id, data },
        {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success("Bike updated successfully");
            }
            else {
              const errorMessage
                = result.data?.message || "Error updating bikes";
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(error, "Error updating bikes");
            toast.error(errorMessage);
          },
        },
      );
    },
    [updateBikeMutation, hasToken, navigation],
  );
  const deleteBike = useCallback(
    (id: string) => {
      if (!hasToken) {
        navigation.navigate("Login" as never);
        return;
      }
      deleteBikeMutation.mutate(id, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success("Bike deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["bikes"] });
          }
          else {
            const errorMessage = result.data?.message || "Error deleting bikes";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error deleting bikes");
          toast.error(errorMessage);
        },
      });
    },
    [deleteBikeMutation,hasToken, navigation, queryClient],
  );
  const reportBike = useCallback(
    (id: string) => {
      if (!hasToken) {
        navigation.navigate("Login" as never);
        return;
      }
      reportBikeMutation.mutate(id, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success("Bike reported successfully");
          }
          else {
            const errorMessage = result.data?.message || "Error reporting bike";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error reporting bike");
          toast.error(errorMessage);
        },
      });
    },
    [reportBikeMutation, hasToken, navigation],
  );
  const getBikeByID = useCallback(() => {
    if (!hasToken) {
      navigation.navigate("Login" as never);
      return;
    }
    useGetDetailBike();
  }, [useGetDetailBike]);
  return {
    getBikes,
    createBike,
    updateBike,
    deleteBike,
    reportBike,
    getBikeByID,
    isFetchingBikeDetail,
    isFetchingBike: isFetchingBikeDetail,
    isReportingBike: reportBikeMutation.isPending,
    isDeletingBike: deleteBikeMutation.isPending,
    useGetBikes,
    useGetAllBikeQuery,
    isFetchingAllBikes,
    allBikes: Array.isArray(allBikes) ? allBikes : [],
    totalRecords,
    detailBike: detailBike?.result,
    isUpdatingBike: updateBikeMutation.isPending,
    isCreatingBike: useCreateBike.isPending,
  };
}
