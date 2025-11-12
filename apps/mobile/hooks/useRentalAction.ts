import type { RentalSchemaFormData } from "@schemas/rentalSchema";
import type { AxiosError } from "axios";

import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";

import type { EndRentalVariables } from "./mutations/Rentals/usePutEndCurrentRental";

import { usePostRentQuery } from "./mutations/Rentals/usePostRentQuery";
import usePutEndCurrentRental from "./mutations/Rentals/usePutEndCurrentRental";
import { useGetAllRentalsQuery } from "./query/Rent/useGetAllRentalsQuery";
import { useGetDetailRentalQuery } from "./query/Rent/useGetDetailRentalQuery";

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
export function useRentalsActions(hasToken: boolean, bikeId?: string, station_id?: string, onEndRentalSuccess?: () => void) {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const useGetAllRentals = useGetAllRentalsQuery();
  const useGetDetailRentals = useGetDetailRentalQuery(bikeId || "");
  const usePutEndRental = usePutEndCurrentRental();
  const usePostRent = usePostRentQuery();
  const getAllRentals = useCallback(() => {
    useGetAllRentals.refetch();
  }, [hasToken, navigation, useGetAllRentals]);
  const useGetDetailRental = useCallback(() => {
    useGetDetailRentals.refetch();
  }, [hasToken, navigation, useGetDetailRentals]);
  const endCurrentRental = useCallback(async (data: EndRentalVariables) => {
    usePutEndRental.mutate(data, {
      onSuccess: (result) => {
        if (result.status === 200) {
          Alert.alert("Success", "Rental ended successfully.");
          onEndRentalSuccess?.();
          queryClient.invalidateQueries({
            queryKey: ["bikes", "all", undefined, undefined],
          });
          queryClient.invalidateQueries({
            queryKey: ["rentals", "all", 1, 10],
          });
          queryClient.invalidateQueries({
            queryKey: ["all-stations"],
          });
          queryClient.invalidateQueries({
            queryKey: ["station"],
          });
          queryClient.invalidateQueries({
            queryKey: ["subscriptions"],
          });
        }
        else {
          Alert.alert("Error", "Failed to end the rental.");
        }
        queryClient.invalidateQueries({
          queryKey: ["rentals", "detail", data.id],
        });
      },
      onError: (error) => {
        const axiosError = error as AxiosError<any>;
        const status = axiosError.response?.status;
        const message
          = axiosError.response?.data?.message
            || "An error occurred while ending the rental.";
        if (status === 400) {
          Alert.alert("Invalid Request", message);
        }
        else if (status === 401) {
          Alert.alert("Unauthorized", "Your session has expired.");
        }
        else {
          Alert.alert("Error", message);
        }

        console.log("Error detail:", axiosError.response?.data);
      },
    });
  }, [hasToken, navigation, usePutEndRental]);
  const postRent = useCallback(
    async (data: RentalSchemaFormData) => {
      usePostRent.mutate(data, {
        onSuccess: (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === 200) {
            Alert.alert("Success", "Thuê xe thành công.");
            queryClient.invalidateQueries({
              queryKey: [
                "bikes",
                "all",
                1,
                20,
                station_id,
                undefined,
                undefined,
              ],
            });
            queryClient.invalidateQueries({
              queryKey: ["rentals", data.bike_id],
            });
            queryClient.invalidateQueries({
              queryKey: ["rentals", "all", 1, 10],
            });
            queryClient.invalidateQueries({
              queryKey: ["all-stations"],
            });
            queryClient.invalidateQueries({
              queryKey: ["station"],
            });
          }
          else {
            Alert.alert("Error", "Failed to rent the bike.");
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            "An error occurred while renting the bike.",
          );

          // Check if error is due to insufficient balance
          const isInsufficientBalance = errorMessage.includes("không đủ") || errorMessage.includes("insufficient");

          if (isInsufficientBalance) {
            Alert.alert(
              "Không đủ tiền",
              errorMessage,
              [
                {
                  text: "Hủy",
                  onPress: () => {},
                  style: "cancel",
                },
                {
                  text: "Nạp tiền ngay",
                  onPress: () => {
                    navigation.navigate("MyWallet" as never);
                  },
                },
              ],
            );
          }
          else {
            Alert.alert("Lỗi", errorMessage);
          }
        },
      });
    },
    [hasToken, navigation, usePostRent, queryClient],
  );
  return {
    getAllRentals,
    rentalsData: useGetAllRentals.data,
    isGetAllRentalsFetching: useGetAllRentals.isLoading,
    isGetAllRentalsError: useGetAllRentals.isError,
    useGetDetailRental,
    rentalDetailData: useGetDetailRentals.data,
    isGetDetailRentalFetching: useGetDetailRentals.isLoading,
    isGetDetailRentalError: useGetDetailRentals.isError,
    endCurrentRental,
    isEndCurrentRentalLoading: usePutEndRental.isPending,
    postRent,
    isPostRentLoading: usePostRent.isPending,
    refetchingAllRentals: useGetAllRentals.refetch,
  };
}
