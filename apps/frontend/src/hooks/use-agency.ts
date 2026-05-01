import {
  useGetAgencies,
  useGetAgencyDetail,
  useGetAgencyStat,
  useGetAgencyRequests,
  useGetAgencyRequestDetail,
  useGetMyAgencyRequests,
  useGetMyAgencyRequestDetail,
  useGetMyStationDetailAgency,
  useGetMyStationsAgency,
  useGetBikeInMyStationAgencyQuery,
  useGetBikeDetailInMyStationAgencyQuery,
  useGetRentalInMyStationAgency,
  useGetRentalDetailAgencyInMyStation,
  useGetReservationInMyStationAgency,
  useGetReservationDetailInMyStationAgency,
  useGetStationRevenueForAgency,
} from "@queries";
import {
  useUpdateAgencyStatusMutation,
  useUpdateAgencyMutation,
  useApproveAgencyRequestMutation,
  useCancelAgencyRequestMutation,
  useRegisterAgencyRequestMutation,
  useRejectAgencyRequestMutation,
  useCreateAgencyMutation,
} from "@mutations";
import { toast } from "sonner";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UpdateAgencyFormData,
  UpdateAgencyStatusFormData,
  RegisterAgencyFormData,
  AdminCreateAgencyUserRequest,
} from "@/schemas";
import { HTTP_STATUS } from "@/constants";
import { useQueryClient } from "@tanstack/react-query";
import {
  getErrorMessageFromAgencyCode,
  getAxiosErrorCodeMessage,
} from "@utils";
import { BikeStatus, RentalStatus, ReservationStatus, AgencyStatus } from "@/types";
import { useUpdateStatusBikeMutation } from "./mutations/Agency/useUpdateStatusBikeMutation";
export interface AgencyActionProps {
  hasToken?: boolean;
  agency_id?: string;
  page?: number;
  pageSize?: number;
  agency_request_id?: string;
  station_id?: string;
  bike_detail_id?: string;
  rental_id?: string;
  reservation_id?: string;
  status ?: BikeStatus;
  renservation_status ?: ReservationStatus;
  rental_status ?: RentalStatus,
  requesterUserId?: string;
  status_agency_request?: string;
  requesterEmail?: string;
  agencyName?: string;
  name ?: string;
  stationAddress?: string;
  contactPhone?: string;
  contactName?: string;
  status_agency?: AgencyStatus | "all";
  userId?: string;
  bikeId?: string;
  startStation?: string;
  endStation?: string;
  stationId?: string;
  supplierId?: string;
  option?: string;
}
export const useAgencyActions = ({
  hasToken,
  agency_id,
  page,
  pageSize,
  agency_request_id,
  station_id,
  bike_detail_id,
  rental_id,
  reservation_id,
  status,
  renservation_status,
  rental_status,
  requesterUserId,
  status_agency_request,
  requesterEmail,
  agencyName,
  name,
  stationAddress,
  contactPhone,
  contactName,
  status_agency,
  userId,
  bikeId,
  startStation,
  endStation,
  stationId,
  supplierId,
  option,
}: AgencyActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: agencyRequest,
    refetch: refetchGetAgencyRequest,
    isLoading: isLoadingAgencyRequest,
  } = useGetAgencyRequests({ page: page, pageSize: pageSize , 
    requesterUserId:requesterUserId,
    status:status_agency_request,
    requesterEmail:requesterEmail,
    agencyName:agencyName,
  });
  const getAgencyRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetAgencyRequest();
  }, [refetchGetAgencyRequest, hasToken, router, page,status_agency_request,requesterEmail,agencyName]);
  const {
    data: myAgencyRequest,
    refetch: refetchGetMyAgencyRequest,
    isLoading: isLoadingMyAgencyRequest,
  } = useGetMyAgencyRequests({ page: page, pageSize: pageSize });
  const getMyAgencyRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetMyAgencyRequest();
  }, [refetchGetMyAgencyRequest, hasToken, router, page]);
  const {
    data: agencyRequestDetail,
    refetch: refetchGetAgencyRequestDetail,
    isLoading: isLoadingAgencyRequestDetail,
  } = useGetAgencyRequestDetail({ id: agency_request_id || "" });
  const getAgencyRequestDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetAgencyRequestDetail();
  }, [refetchGetAgencyRequestDetail, hasToken, router, page]);
  const {
    data: myAgencyRequestDetail,
    refetch: refetchGetMyAgencyRequestDetail,
    isLoading: isLoadingMyAgencyRequestDetail,
  } = useGetMyAgencyRequestDetail({ id: agency_request_id || "" });
  const getMyAgencyRequestDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetMyAgencyRequestDetail();
  }, [refetchGetMyAgencyRequestDetail, hasToken, router, page]);
  const {
    data: agencies,
    refetch: refetchGetAgencies,
    isLoading: isLoadingAgencies,
  } = useGetAgencies({ page: page, pageSize: pageSize ,
    name : name,
    stationAddress : stationAddress,
    contactPhone : contactPhone,
    contactName : contactName,
    status : status_agency,
   });
  const getAgencies = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetAgencies();
  }, [refetchGetAgencies, hasToken, router, page,name,stationAddress,contactPhone,contactName,status_agency]);
  const {
    data: agencyDetail,
    refetch: refetchAgencyDetail,
    isLoading: isLoadingAgencyDetail,
  } = useGetAgencyDetail({ id: agency_id || "" });
  const getAgencyDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAgencyDetail();
  }, [refetchAgencyDetail, hasToken, router, agency_id]);
  const {
    data: agencyStats,
    refetch: refetchAgencyStats,
    isLoading: isLoadingAgencyStats,
  } = useGetAgencyStat({ id: agency_id || "" });
  const getAgencyStat = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAgencyStats();
  }, [refetchAgencyStats, hasToken, router, agency_id]);
  const updateAgencyMutation = useUpdateAgencyMutation();
  const updateStatusMutation = useUpdateAgencyStatusMutation();
  const approveAgencyRequestMutation = useApproveAgencyRequestMutation();
  const rejectAgencyRequestMutation = useRejectAgencyRequestMutation();
  const cancelAgencyRequestMutation = useCancelAgencyRequestMutation();
  const registerAgencyRequestMutation = useRegisterAgencyRequestMutation();
  const createAgencyMutation = useCreateAgencyMutation();
  const updateAgency = useCallback(
    async (data: UpdateAgencyFormData, id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await updateAgencyMutation.mutateAsync({
          id: id,
          data: data,
        });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Cập nhật thông tin agency thành công");
          queryClient.invalidateQueries({
            queryKey: ["data", "agencies"],
          });
          queryClient.invalidateQueries({
            queryKey: ["stats", "agency", id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [hasToken, updateAgencyMutation],
  );
  const createAgency = useCallback(
    async (data: AdminCreateAgencyUserRequest) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await createAgencyMutation.mutateAsync(data);
        if (result.status === HTTP_STATUS.CREATED) {
          toast.success("Tạo agency thành công");
          queryClient.invalidateQueries({
            queryKey: ["data", "agencies"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [hasToken, createAgencyMutation],
  );
  const updateAgencyStatus = useCallback(
    async (data: UpdateAgencyStatusFormData, id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await updateStatusMutation.mutateAsync({
          id: id,
          data: data,
        });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Cập nhật thông tin agency thành công");
          queryClient.invalidateQueries({
            queryKey: ["data", "agencies"],
          });
          queryClient.invalidateQueries({
            queryKey: ["stats", "agency", id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [updateStatusMutation, hasToken],
  );
  const approveAgencyRequest = useCallback(
    async ({ id, description }: { id: string; description?: string }) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await approveAgencyRequestMutation.mutateAsync({
          id: id,
          description: description,
        });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Chấp nhận yêu cầu trở thành Agency");
          queryClient.invalidateQueries({
            queryKey: [],
          });
          queryClient.invalidateQueries({
            queryKey: ["data", "agencies"],
          });
          queryClient.invalidateQueries({
            queryKey: ["stats", "agency", id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [approveAgencyRequestMutation, hasToken],
  );
  const rejectAgencyRequest = useCallback(
    async ({
      id,
      reason,
      description,
    }: {
      id: string;
      reason?: string;
      description?: string;
    }) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await rejectAgencyRequestMutation.mutateAsync({
          id: id,
          description: description,
          reason: reason,
        });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Từ chối yêu cầu trở thành Agency");
          queryClient.invalidateQueries({
            queryKey: [],
          });
          queryClient.invalidateQueries({
            queryKey: ["data", "agencies"],
          });
          queryClient.invalidateQueries({
            queryKey: ["stats", "agency", id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [rejectAgencyRequestMutation, hasToken],
  );
  const cancelAgencyRequest = useCallback(
    async ({ id }: { id: string }) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await cancelAgencyRequestMutation.mutateAsync({
          id: id,
        });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Hủy đơn trở thành Agency");
          queryClient.invalidateQueries({
            queryKey: [],
          });
          queryClient.invalidateQueries({
            queryKey: ["data", "agencies"],
          });
          queryClient.invalidateQueries({
            queryKey: ["stats", "agency", id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [rejectAgencyRequestMutation, hasToken],
  );
  const registerAgencyRequest = useCallback(
    async ({ data }: { data: RegisterAgencyFormData }) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await registerAgencyRequestMutation.mutateAsync({
          data: data,
        });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Đăng ký trở thành Agency thành công");
          queryClient.invalidateQueries({
            queryKey: [],
          });
          queryClient.invalidateQueries({
            queryKey: ["data", "agencies"],
          });
          queryClient.invalidateQueries({
            queryKey: ["stats", "agency"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [registerAgencyRequestMutation, hasToken],
  );
  const {
    data: agencyStation,
    refetch: refetchMyAgencyStation,
    isLoading: isLoadingMyAgencyStation,
  } = useGetMyStationsAgency({ page: page, pageSize: pageSize });
  const getMyAgencyStation = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchMyAgencyStation();
  }, [refetchMyAgencyStation, hasToken, page, pageSize]);
  const {
    data: myStationDetail,
    refetch: refetchMyAgencyStationDetail,
    isLoading: isLoadingMyStationDetail,
  } = useGetMyStationDetailAgency({ stationId: station_id || "" });
  const getMyStationDetail = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchMyAgencyStationDetail();
  }, [refetchMyAgencyStationDetail, hasToken, station_id]);
  const {
    data: myAgencyBikeInStation,
    refetch: refetchMyAgencyBikeInStation,
    isLoading: isLoadingMyAgencyBikeInStation,
  } = useGetBikeInMyStationAgencyQuery({ page: page, pageSize: pageSize, status: status, stationId: stationId, supplierId: supplierId });
  const getMyAgencyBikeInStation = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchMyAgencyBikeInStation();
  }, [refetchMyAgencyBikeInStation, hasToken, page, pageSize]);
  const {
    data: myAgencyBikeInStationDetail,
    refetch: refetchMyAgencyBikeInStationDetail,
    isLoading: isLoadingMyAgencyBikeInStationDetail,
  } = useGetBikeDetailInMyStationAgencyQuery(bike_detail_id || "");
  const getMyAgencyBikeInStationDetail = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchMyAgencyBikeInStationDetail();
  }, [refetchMyAgencyBikeInStationDetail, hasToken, bike_detail_id]);
  const {
    data: detailRentalForAgency,
    isLoading: isDetailRentalLoadingForAgency,
    refetch: refetchDetailForAgency,
  } = useGetRentalDetailAgencyInMyStation({ id: rental_id || "" });
  const getDetailRentalForAgency = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchDetailForAgency();
  }, [refetchDetailForAgency, hasToken, rental_id]);
  const {
    data: rentalInMyStation,
    refetch: refetchRentalInMyStation,
    isLoading: isLoadingRentalInMyStation,
  } = useGetRentalInMyStationAgency({
    page: page,
    pageSize: pageSize,
    status: rental_status,
    userId: userId,
    bikeId: bikeId,
    startStation: startStation,
    endStation: endStation,
  });
  const getRentalInMyStation = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchRentalInMyStation();
  }, [refetchRentalInMyStation, hasToken, page, pageSize,rental_status]);
  const {
    data: allReservationsAgency,
    refetch: refetchReservationsForAgency,
    isLoading: isLoadingReservationsAgency,
  } = useGetReservationInMyStationAgency({ page: page, pageSize: pageSize,reservation_status:renservation_status,userId:userId,bikeId:bikeId,option:option });
  const getReservationsForAgency = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchReservationsForAgency();
  }, [refetchReservationsForAgency, hasToken, page, pageSize,renservation_status]);
  const {
    data: detailReservationForAgency,
    refetch: refetchDetailReservationForAency,
    isLoading : isLoadingDetailReservationForAgency,
  } = useGetReservationDetailInMyStationAgency({ id: reservation_id || "" });
  const getDetailReservationForAgency = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchDetailReservationForAency();
  }, [refetchDetailReservationForAency, hasToken, reservation_id]);
  const updateBikeStatusMutation = useUpdateStatusBikeMutation();
  const updateBikeStatus = useCallback(
    async (id: string, status: "AVAILABLE" | "BROKEN") => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await updateBikeStatusMutation.mutateAsync({ id, status });
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Cập nhật trạng thái xe đạp thành công");
          queryClient.invalidateQueries({
            queryKey: ["bikes", "all"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [
      updateBikeStatusMutation,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const {
      data: responseStationRevenueForAgency,
      refetch: refetchStationRevenueForAgency,
      isLoading: isLoadingStationRevenueForAgency,
    } = useGetStationRevenueForAgency();
  const getStationRevenueForAgency = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchStationRevenueForAgency();
  }, [refetchStationRevenueForAgency, hasToken]);
  return {
    agencies,
    getAgencies,
    isLoadingAgencies,
    getAgencyDetail,
    isLoadingAgencyDetail,
    agencyDetail,
    getAgencyStat,
    agencyStats,
    isLoadingAgencyStats,
    updateAgency,
    updateAgencyStatus,
    approveAgencyRequest,
    rejectAgencyRequest,
    cancelAgencyRequest,
    registerAgencyRequest,
    agencyRequest,
    getAgencyRequest,
    isLoadingAgencyRequest,
    getAgencyRequestDetail,
    agencyRequestDetail,
    isLoadingAgencyRequestDetail,
    myAgencyRequest,
    getMyAgencyRequest,
    isLoadingMyAgencyRequest,
    myAgencyRequestDetail,
    getMyAgencyRequestDetail,
    isLoadingMyAgencyRequestDetail,
    createAgency,
    agencyStation,
    getMyAgencyStation,
    isLoadingMyAgencyStation,
    myStationDetail,
    getMyStationDetail,
    isLoadingMyStationDetail,
    myAgencyBikeInStation,
    getMyAgencyBikeInStation,
    isLoadingMyAgencyBikeInStation,
    myAgencyBikeInStationDetail,
    getMyAgencyBikeInStationDetail,
    isLoadingMyAgencyBikeInStationDetail,
    detailRentalForAgency,
    isLoadingRentalInMyStation,
    getDetailRentalForAgency,
    rentalInMyStation,
    getRentalInMyStation,
    allReservationsAgency,
    getReservationsForAgency,
    isLoadingReservationsAgency,
    detailReservationForAgency,
    getDetailReservationForAgency,
    isLoadingDetailReservationForAgency,
    isDetailRentalLoadingForAgency,
    updateBikeStatus,
    isUpdatingStatus : updateBikeStatusMutation.isPending,
    responseStationRevenueForAgency,
    isLoadingStationRevenueForAgency,
    getStationRevenueForAgency,
  };
};
