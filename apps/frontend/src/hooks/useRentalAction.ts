import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllRentalsAdminStaffQuery } from "./query/Rent/useGetAllRentalsAdminStaffQuery";
import { useRouter } from "next/navigation";
import { useGetRevenueQuery } from "./query/Rent/useGetRevenueQuery";
import { useGetDetailRentalAdminQuery } from "./query/Rent/useGetDetailRentalAdminQuery";
import { usePutUpdateRentalMutation } from "./mutations/Rentals/usePutUpdateRentalMutation";
import { UpdateRentalSchema } from "@/schemas/rentalSchema";
import { toast } from "sonner";
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
  limit ?: number;
  page ?: number;
  start_station?: string;
  end_station?: string;
  status?: "ĐANG THUÊ" | "HOÀN THÀNH" | "ĐÃ HỦY" | "ĐÃ ĐẶT TRƯỚC";
}
export function useRentalsActions({
  hasToken,
  bike_id,
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
  const usePutUpdateRental = usePutUpdateRentalMutation(bike_id || "");
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
  const { data: revenueData , refetch : refetchRevenue , isLoading : isLoadingRevenue } = useGetRevenueQuery(
    { from: undefined, to: undefined, groupBy: "MONTH" }
  );
  const getRevenue = useCallback(() => {
    if(!hasToken){
      return;
    }
    refetchRevenue();
  }, [hasToken, refetchRevenue]);
  const { data: todayRevenueData , refetch : refetchTodayRevenue , isLoading : isLoadingTodayRevenue } = useGetRevenueQuery(
    { from: new Date().toISOString().slice(0,10), to: new Date().toISOString().slice(0,10), groupBy: "DAY" }
  );
  const getTodayRevenue = useCallback(() => {
    if(!hasToken){
      return;
    }
    refetchTodayRevenue();
  }, [hasToken, refetchTodayRevenue]);
  const updateRental = useCallback(
    (data: UpdateRentalSchema) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      usePutUpdateRental.mutate(
        data,
        {
          onSuccess: (result: {
            status: number;
            data?: { message?: string };
          }) => {
            if (result.status === 200) {
              toast.success("Rental updated successfully");
              queryClient.invalidateQueries({
                queryKey: [
                  "rentals",
                  "all-admin-staff",
                  page,
                  limit,
                  start_station,
                  end_station,
                  status,
                ],
              });
            } else {
              const errorMessage =
                result.data?.message || "Error updating rental";
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(error, "Error updating rental");
            toast.error(errorMessage);
          },
        }
      );
    },
    [
      usePutUpdateRental,
      hasToken,
      router,
      queryClient,
      page,
      limit,
      start_station,
      end_station,
      status,
    ]
  );
  return {
    allRentalsData: allRentalsData?.data,
    getRentals,
    pagination: allRentalsData?.pagination,
    isAllRentalsLoading,
    revenueData,
    todayRevenueData,
    updateRental,
    getRevenue,
    getTodayRevenue,
    refetchRevenue,
    refetchTodayRevenue,
    isLoadingRevenue,
    isLoadingTodayRevenue,
    getDetailRental,
    detailData,
    isDetailLoading,
  };
}

