import type { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllRentalsAdminStaffQuery } from "./query/Rent/useGetAllRentalsAdminStaffQuery";
import { useRouter } from "next/navigation";
import { useGetRevenueQuery } from "./query/Rent/useGetRevenueQuery";
import { useGetDetailRentalAdminQuery } from "./query/Rent/useGetDetailRentalAdminQuery";
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
export type EndRentalVariables = {
  id: string;
};
function getErrorMessage(error: unknown, defaultMessage: string): string {
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
}
interface UseRentalsActionsProps {
  hasToken: boolean;
  bike_id?: string;
  station_id?: string;
  limit ?: number;
  page ?: number;
  start_station?: string;
  end_station?: string;
  status?: "ĐANG THUÊ" | "HOÀN THÀNH" | "ĐÃ HỦY" | "ĐÃ ĐẶT TRƯỚC";
}
export function useRentalsActions({
  hasToken,
  bike_id,
  station_id,
  limit,
  page,
  start_station,
  end_station,
  status,
} : UseRentalsActionsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: detailData, isLoading: isDetailLoading ,
    refetch : refetchDetail
  } = useGetDetailRentalAdminQuery(bike_id || "");
  const getDetailRental = useCallback(() => {
    if(!hasToken || !bike_id){
      return;
    } 
    refetchDetail();
  }, [hasToken, bike_id, refetchDetail]);
  const {
    data: allRentalsData,
    refetch: refetchAllRentals,
    isLoading: isAllRentalsLoading,
  } = useGetAllRentalsAdminStaffQuery(
    {
      page: page,
      limit: limit,
      start_station: start_station,
      end_station: end_station,
      status: status,
    }
  );
  const getRentals = useCallback(() => {
    if(!hasToken){
      return;
    }
    refetchAllRentals();
  }, [hasToken, refetchAllRentals]);
  const { data: revenueData , refetch : refetchRevenue , isLoading : isLoadingRevenue } = useGetRevenueQuery();
  const getRevenue = useCallback(() => {
    if(!hasToken){
      return;
    }
    refetchRevenue();
  }, [hasToken, refetchRevenue]);
  return {
    allRentalsData: allRentalsData?.data,
    getRentals,
    pagination: allRentalsData?.pagination,
    isAllRentalsLoading,
    revenueData,
    getRevenue,
    refetchRevenue,
    isLoadingRevenue,
    getDetailRental,
    detailData,
    isDetailLoading,
  };
}
