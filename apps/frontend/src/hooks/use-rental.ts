import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllRentalsAdminStaffQuery } from "./query/Rent/useGetAllRentalsAdminStaffQuery";
import { useRouter } from "next/navigation";
import { useGetRevenueQuery } from "./query/Rent/useGetRevenueQuery";
import { useGetDetailRentalAdminQuery } from "./query/Rent/useGetDetailRentalAdminQuery";
import { usePutUpdateRentalMutation } from "./mutations/Rentals/usePutUpdateRentalMutation";
import { EndRentalSchema, UpdateRentalSchema } from "@/schemas/rental-schema";
import { toast } from "sonner";
import { useGetDashboardSummaryQuery } from "./query/Rent/useGetDashboardSummaryQuery";
import useEndCurrentRental from "./mutations/Rentals/useEndCurrentRentalMutation";
import { useGetSummaryRentalQuery } from "./query/Rent/useGetSummaryRental";
import { QUERY_KEYS } from "@/constants/queryKey";
import getErrorMessage from "@/utils/error-message";
import { RentalStatus } from "@/types";
import { useGetAllRentalsStaffQuery } from "./query/Rent/useGetAllRentalsStaff";
import { useGetDetailRentalForStaffQuery } from "./query/Rent/uesGetDetailRentalForStaffQuery";

interface UseRentalsActionsProps {
  hasToken: boolean;
  bike_id?: string;
  limit ?: number;
  page ?: number;
  startStation?: string;
  endStation?: string;
  status?: RentalStatus;
  rental_id?: string;
  userId ?: string;
  bikeId ?: string;
}
export function useRentalsActions({
  hasToken,
  bike_id,
  limit,
  page,
  startStation,
  endStation,
  status,
  rental_id,
  userId,
  bikeId,
} : UseRentalsActionsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: detailData, isLoading: isDetailLoading ,
    refetch : refetchDetail
  } = useGetDetailRentalAdminQuery(rental_id || "");
  const {data : detailDataForStaff , isLoading : isDetailLoadingForStaff , refetch:refetchDetailForStaff} = useGetDetailRentalForStaffQuery(rental_id || "");
  const usePutUpdateRental = usePutUpdateRentalMutation(rental_id || "");
  const getDetailRental = useCallback(() => {
    if(!hasToken || !rental_id){
      return;
    } 
    refetchDetail();
  }, [hasToken, rental_id, refetchDetail]);
    const getDetailRentalForStaff = useCallback(() => {
    if(!hasToken || !rental_id){
      return;
    } 
    refetchDetailForStaff();
  }, [hasToken, rental_id, refetchDetailForStaff]);
  const {
    data: allRentalsData,
    refetch: refetchAllRentals,
    isLoading: isAllRentalsLoading,
  } = useGetAllRentalsAdminStaffQuery(
    {
      page: page,
      pageSize: limit,
      startStation: startStation,
      endStation: endStation,
      status: status,
      userId : userId,
      bikeId : bikeId,
    }
  );
  const {
    data: staffRentalsData,
    refetch: refetchStaffRentals,
    isLoading: isAllRentalsStaffLoading,
  } = useGetAllRentalsStaffQuery(
    {
      page: page,
      pageSize: limit,
      startStation: startStation,
      endStation: endStation,
      status: status,
      userId : userId,
      bikeId : bikeId,
    }
  );
  const getStaffRentals = useCallback(() => {
    if(!hasToken){
      return;
    }
    refetchStaffRentals();
  }, [hasToken, refetchStaffRentals,page,limit,status,userId,bikeId,startStation,endStation]);
  const getRentals = useCallback(() => {
    if(!hasToken){
      return;
    }
    refetchAllRentals();
  }, [hasToken, refetchAllRentals,page,limit,startStation,endStation,status,userId,bikeId]);
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
    // { from: new Date().toISOString().slice(0,10), to: new Date().toISOString().slice(0,10), groupBy: "DAY" }
    {}
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
              toast.success("Phiên thuê xe đã được cập nhật thành công");
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.RENTAL.ALL_ADMIN_STAFF(),
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
      startStation,
      endStation,
      status,
    ]
  );
  const { data: dashboardSummaryData , refetch: refetchDashboardSummary } = useGetDashboardSummaryQuery();
  const getDashboardSummary = useCallback(() => {
    if(!hasToken){
      return;
    }
    refetchDashboardSummary();
  }, [hasToken, refetchDashboardSummary]);
  const useEndRental = useEndCurrentRental(rental_id || "");
  const endRental = useCallback(
    (data: EndRentalSchema) => {
      if (!hasToken || !rental_id) {
        router.push("/login");
        return;
      }
      useEndRental.mutate(data, {
        onSuccess: (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === 200) {
            toast.success(result.data?.message || "Kết thúc thuê xe thành công");
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.RENTAL.ALL_ADMIN_STAFF(
                page,
                limit,
                startStation,
                endStation,
                status,
                userId,
                bikeId
              ),
            });
          } else {
            const errorMessage =
              result.data?.message || "Lỗi khi kết thúc thuê xe";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Failed to end rental");
          toast.error(errorMessage);
        },
      });
    },
    [
      useEndRental,
      hasToken,
      rental_id,
      router,
      queryClient,
      page,
      limit,
      startStation,
      endStation,
      status,
    ]
  );
  const {data : summaryRental , refetch : refetchSummaryRental , isLoading : isLoadingSummaryRental } = useGetSummaryRentalQuery();
  const getSummaryRental = useCallback(() => {
    if(!hasToken){
      return;
    }
    refetchSummaryRental();
  }, [hasToken, refetchSummaryRental]);
  return {
    allRentalsData: allRentalsData?.data,
    getRentals,
    pagination: allRentalsData?.pagination,
    isAllRentalsLoading,
    revenueData,
    todayRevenueData,
    updateRental,
    endRental,
    getRevenue,
    getTodayRevenue,
    refetchRevenue,
    refetchTodayRevenue,
    isLoadingRevenue,
    isLoadingTodayRevenue,
    getDetailRental,
    detailData,
    isDetailLoading,
    dashboardSummaryData,
    getDashboardSummary,
    summaryRental,
    getSummaryRental,
    staffRentalsData:staffRentalsData?.data,
    refetchStaffRentals,
    isAllRentalsStaffLoading,
    paginationStaffRental : staffRentalsData?.pagination,
    getStaffRentals,
    detailDataForStaff : detailDataForStaff?.data,
    refetchDetailForStaff,
    isDetailLoadingForStaff,
    getDetailRentalForStaff
  };
}

