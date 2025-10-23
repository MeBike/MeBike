import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllStation } from "./query/Station/useGetAllStationQuery";
import { useGetStationById } from "./query/Station/useGetStationByIDQuery";
import { useCreateBikeMutation } from "./mutations/Bike/useCreateBike";
import { StationSchemaFormData } from "@/schemas/stationSchema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateSupplierMutation } from "./mutations/Station/useCreateStationQuery";
import { useSoftDeleteBikeMutation } from "./mutations/Bike/useSoftDeleteBike";
import { useSoftDeleteStationMutation } from "./mutations/Station/useSoftDeleteStationMutation";
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
  hasToken: boolean;
  stationId?: string;
  page ?: number ;
  limit ?: number ;
}
export const useStationActions = ({hasToken , stationId , page , limit} : StationActionProps ) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { refetch, data: response, isLoading } = useGetAllStation({page: page , limit: limit});
  const {
    refetch: fetchingStationID,
    data: responseStationDetail,
    isLoading: isLoadingStationID,
  } = useGetStationById(stationId || "");
  const useCreateStation = useCreateSupplierMutation();
  const useSoftDeleteStation = useSoftDeleteStationMutation();
  const getAllStations = useCallback(async ({page,limit} : {page ?: number , limit ?: number}) => {
    if (!hasToken) {
      return;
    }
    refetch();
  }, [refetch, hasToken ]);
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
            const errorMessage = getErrorMessage(error, "Error deleting stations");
            toast.error(errorMessage);
          },
        });
      },
      [hasToken, router, queryClient, useCreateStation]
    );
  return {
    getAllStations,
    getStationByID,
    refetch,
    createStation,
    useGetAllStation,
    deleteStation,
    stations: response?.data || [],
    paginationStations: response?.pagination,
    isLoadingGetAllStations: isLoading,
    fetchingStationID,
    responseStationDetail,
    isLoadingGetStationByID: isLoadingStationID,
  };
};
