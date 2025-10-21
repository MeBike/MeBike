
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useGetAllRentalsQuery } from "./query/Rent/useGetAllRentalsQuery";
import { useGetDetailRentalQuery } from "./query/Rent/useGetDetailRentalQuery";
import usePutEndCurrentRental, { EndRentalVariables } from "./mutations/Rentals/usePutEndCurrentRental";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { usePostRentQuery } from "./mutations/Rentals/usePostRentQuery";
import { RentalSchemaFormData } from "@schemas/rentalSchema";
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
export const useRentalsActions = (
  hasToken : boolean, 
  bikeId?: string
) => {
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
                  queryClient.invalidateQueries({
                    queryKey: ["rentals", "all", 1, 10],
                  });
                } else {
                  Alert.alert("Error", "Failed to end the rental.");
                }
              },
              onError: (error) => {
                const errorMessage = getErrorMessage(
                  error,
                  "An error occurred while ending the rental."
                );
                console.log(errorMessage);
              }, 
        });
    }, [hasToken, navigation, usePutEndRental]);
    const postRent = useCallback(
      async (data: RentalSchemaFormData) => {
        usePostRent.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              Alert.alert("Success", "Thuê xe thành công.");
              queryClient.invalidateQueries({
                queryKey: ["rentals", data.bike_id],
              });
              queryClient.invalidateQueries({
                queryKey: ["rentals", "all", 1, 10],
              });
            } else {
              Alert.alert("Error", "Failed to end the rental.");
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(
              error,
              "An error occurred while ending the rental."
            );
            console.log(errorMessage);
          },
        });
      },
      [hasToken, navigation, usePutEndRental]
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
    };
}