import { useQueryClient } from "@tanstack/react-query";
import { use, useCallback } from "react";
import { toast } from "sonner";
import { useGetAllBike } from "./query/Bike/useGetAllBikeCus";
import { bikeService } from "@/services/bikeService";
import { useCreateBikeMutation } from "./mutations/Bike/useCreateBike";
import type  { BikeSchemaFormData, UpdateBikeSchemaFormData } from "@/schemas/bikeSchema";
import { useUpdateBike } from "./mutations/Bike/useUpdateBike";
import { useSoftDeleteBikeMutation } from "./mutations/Bike/useSoftDeleteBike";
import { useReportBike } from "./mutations/Bike/useReportBike";
import { useGetBikeByIDAll } from "./query/Bike/useGetBIkeByIDAll";
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
export const useBikeActions = (
  setHasToken: React.Dispatch<React.SetStateAction<boolean>>, 
  bikeId?: string
) => {
    const useGetBikes = useGetAllBike();
    const useCreateBike = useCreateBikeMutation();
    const updateBikeMutation = useUpdateBike();
    const deleteBikeMutation = useSoftDeleteBikeMutation();
    const reportBikeMutation = useReportBike();
    const bikeByIdQuery = useGetBikeByIDAll(bikeId || '');
    const queryClient = useQueryClient();
    const getBikes = useCallback(() => {
        useGetBikes.refetch();
    }, [useGetBikes]);
    const createBike = useCallback(
      (data: BikeSchemaFormData) => {
        useCreateBike.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 201) {
              toast.success("Bike created successfully");
            } else {
              const errorMessage =
                result.data?.message || "Error creating bikes";
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(error, "Error creating bikes");
            toast.error(errorMessage);
          },
        });
      },
      [useCreateBike]
    );
    const updateBike = useCallback(
      (data: UpdateBikeSchemaFormData, id: string) => {
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
              const errorMessage = getErrorMessage(
                error,
                "Error updating bikes"
              );
              toast.error(errorMessage);
            },
          }
        );
      },
      [updateBikeMutation]
    );
    const deleteBike = useCallback(
      (id: string) => {
        deleteBikeMutation.mutate(id, {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success("Bike deleted successfully");
              queryClient.invalidateQueries({ queryKey: ["bikes"] });
            } else {
              const errorMessage =
                result.data?.message || "Error deleting bikes";
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(error, "Error deleting bikes");
            toast.error(errorMessage);
          },
        });
      },
      [deleteBikeMutation]
    );
    const reportBike = useCallback(
    (id: string) => {
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
    [reportBikeMutation]
    );
    const getBikeByID = useCallback(() => {
      bikeByIdQuery.refetch();
    }, [bikeByIdQuery]);
    return {
      getBikes,
      createBike,
      updateBike,
      deleteBike,
      reportBike,
      getBikeByID,
      isFetchingBikeDetail: bikeByIdQuery.isFetching,
      useGetBikeByIDAll,
      bike: bikeByIdQuery.data,
      isGettingBikeByID: bikeByIdQuery.isFetching,
      bikeError: bikeByIdQuery.error,
      refetchBike: bikeByIdQuery.refetch,
      isReportingBike: reportBikeMutation.isPending,
      isDeletingBike: deleteBikeMutation.isPending,
      isGettingBikes: useGetBikes.isFetching,
      isUpdatingBike: updateBikeMutation.isPending,
      isCreatingBike: useCreateBike.isPending,
    };
}