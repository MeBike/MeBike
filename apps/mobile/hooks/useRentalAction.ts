
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useGetAllRentalsQuery } from "./query/Rent/useGetAllRentalsQuery";
import { useGetDetailRentalQuery } from "./query/Rent/useGetDetailRentalQuery";
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
    const navigation = useNavigation();
    const useGetAllRentals = useGetAllRentalsQuery();
    const useGetDetailRentals = useGetDetailRentalQuery(bikeId || "");
    const getAllRentals = useCallback(() => {
        if(!hasToken){
            navigation.navigate("Login" as never);
            return;
        }
        useGetAllRentals.refetch();
    }, [hasToken, navigation, useGetAllRentals]);
    const useGetDetailRental = useCallback(() => {
        if(!hasToken){
            navigation.navigate("Login" as never);
            return;
        }
        useGetDetailRentals.refetch();
    }, [hasToken, navigation, useGetDetailRentals]);
    return {
      getAllRentals,
      rentalsData: useGetAllRentals.data,
      isGetAllRentalsFetching: useGetAllRentals.isLoading,
      isGetAllRentalsError: useGetAllRentals.isError,
      useGetDetailRental,
      rentalDetailData: useGetDetailRentals.data,
      isGetDetailRentalFetching: useGetDetailRentals.isLoading,
      isGetDetailRentalError: useGetDetailRentals.isError,
    };
}