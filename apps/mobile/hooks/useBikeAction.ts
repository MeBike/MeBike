import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useGetAllBikeQuery } from "./query/Bike/useGetAllBikeCus";
import { useCreateBikeMutation } from "./mutations/Bike/useCreateBike";
import type {
  BikeSchemaFormData,
  UpdateBikeSchemaFormData,
} from "@schemas/bikeSchema";
import { useUpdateBike } from "./mutations/Bike/useUpdateBike";
import { useSoftDeleteBikeMutation } from "./mutations/Bike/useSoftDeleteBike";
import { useReportBike } from "./mutations/Bike/useReportBike";
import { useGetBikeByIDAllQuery } from "./query/Bike/useGetBIkeByIDAll";
import { useNavigation } from "@react-navigation/native";
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
interface BikeActionsProps {
  hasToken: boolean;
  bikeId?: string;
  station_id?: string;
}
export const useBikeActions = (props: BikeActionsProps) => {
  const navigation = useNavigation();
  const {
    refetch: useGetBikes,
    data: allBikes,
    isFetching: isFetchingAllBikes,
  } = useGetAllBikeQuery({ page: 1, limit: 10, station_id: props.station_id });
  const useCreateBike = useCreateBikeMutation();
  const updateBikeMutation = useUpdateBike();
  const deleteBikeMutation = useSoftDeleteBikeMutation();
  const reportBikeMutation = useReportBike();
  const useGetDetailBike = useGetBikeByIDAllQuery(props.bikeId || "");
  const queryClient = useQueryClient();
  const getBikes = useCallback(() => {
    if (!props.hasToken) {
      navigation.navigate("Login" as never);
      return;
    }
    useGetBikes();
  }, [useGetBikes, props.hasToken, navigation , props.station_id]);
  const createBike = useCallback(
    (data: BikeSchemaFormData) => {
      if (!props.hasToken) {
        navigation.navigate("Login" as never);
        return;
      }
      useCreateBike.mutate(data, {
        onSuccess: (result) => {
          if (result.status === 201) {
            toast.success("Bike created successfully");
          } else {
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
    [useCreateBike, props.hasToken, navigation]
  );
  const updateBike = useCallback(
    (data: UpdateBikeSchemaFormData, id: string) => {
      if (!props.hasToken) {
        navigation.navigate("Login" as never);
        return;
      }
      updateBikeMutation.mutate(
        { id, data },
        {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success("Bike updated successfully");
            } else {
              const errorMessage =
                result.data?.message || "Error updating bikes";
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(error, "Error updating bikes");
            toast.error(errorMessage);
          },
        }
      );
    },
    [updateBikeMutation, props.hasToken, navigation]
  );
  const deleteBike = useCallback(
    (id: string) => {
      if (!props.hasToken) {
        navigation.navigate("Login" as never);
        return;
      }
      deleteBikeMutation.mutate(id, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success("Bike deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["bikes"] });
          } else {
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
    [deleteBikeMutation, props.hasToken, navigation, queryClient]
  );
  const reportBike = useCallback(
    (id: string) => {
      if (!props.hasToken) {
        navigation.navigate("Login" as never);
        return;
      }
      reportBikeMutation.mutate(id, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success("Bike reported successfully");
          } else {
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
    [reportBikeMutation, props.hasToken, navigation]
  );
  const getBikeByID = useCallback(() => {
    useGetDetailBike.refetch();
  }, [useGetDetailBike]);
  return {
    getBikes,
    createBike,
    updateBike,
    deleteBike,
    reportBike,
    getBikeByID,
    // isFetchingBikeDetail: is,
    isFetchingBike: useGetDetailBike.isFetching,
    isReportingBike: reportBikeMutation.isPending,
    isDeletingBike: deleteBikeMutation.isPending,
    useGetBikes,
    useGetAllBikeQuery,
    isFetchingAllBikes: isFetchingAllBikes,
    allBikes: Array.isArray(allBikes) ? allBikes : [],
    isUpdatingBike: updateBikeMutation.isPending,
    isCreatingBike: useCreateBike.isPending,
  };
};
