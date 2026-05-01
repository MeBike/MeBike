import { useCancelAgencyRequestMutation } from './mutations/Agency/useCancelAgencyRequest';

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";
import { toast } from "sonner";
import { CreateRedistributionRequestInput } from "@/schemas/distribution-request-schema";
import {
  useGetAdminViewDistributionRequestQuery,
  useGetStaffViewDistributionRequestQuery,
  useGetAgencyViewDistributionRequestQuery,
  useGetManagerViewDistributionRequestQuery,
  useGetAdminViewDistributionRequestDetailQuery,
  useGetStaffViewDistributionRequestDetailQuery,
  useGetAgencyViewDistributionRequestDetailQuery,
  useGetManagerViewDistributionRequestDetailQuery,
} from "@queries";
import {
  useApproveDistributionRequestMutation,
  useRejectDistributionRequestMutation,
  useCreateistributionRequestMutation,
  useCancelDistributionRequestMutation,
  useStartTransitDistributionRequestMutation,
  useCompleteTransitDistributionRequestMutation,
} from "@mutations"
import { useRouter } from "next/navigation";
import { HTTP_STATUS } from "@/constants";
import { getErrorMessageFromDistributionRequestCode, getAxiosErrorCodeMessage } from "@utils";
interface DistributionRequestActionProps {
  page?: number;
  pageSize?: number;
  status?: RedistributionRequestStatus;
  id?: string;
  hasToken: boolean;
  requestedByUserId?: string;
  approvedByUserId?: string;
  sourceStationId?: string;
  targetStationId?: string;
}
export const useDistributionRequest = ({
  page,
  pageSize,
  status,
  id,
  hasToken,
  requestedByUserId,
  approvedByUserId,
  sourceStationId,
  targetStationId,
}: DistributionRequestActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: adminViewDistributionRequest,
    refetch: refetchAdminViewDistributionRequest,
    isFetching: isFetchingAdminViewDistributionRequest,
  } = useGetAdminViewDistributionRequestQuery({
    page: page,
    pageSize: pageSize,
    status: status,
    requestedByUserId: requestedByUserId,
    approvedByUserId: approvedByUserId,
    sourceStationId: sourceStationId,
    targetStationId: targetStationId,
  });
  const {
    data: staffViewDistributionRequest,
    refetch: refetchStaffViewDistributionRequest,
    isFetching: isFetchingStaffViewDistributionRequest,
  } = useGetStaffViewDistributionRequestQuery({
    page: page,
    pageSize: pageSize,
    status: status,
  });
  const {
    data: agencyViewDistributionRequest,
    refetch: refetchAgencyViewDistributionRequest,
    isFetching: isFetchingAgencyViewDistributionRequest,
  } = useGetAgencyViewDistributionRequestQuery({
    page: page,
    pageSize: pageSize,
    status: status,
  });
  const {
    data: managerViewDistributionRequest,
    refetch: refetchManagerViewDistributionRequest,
    isFetching: isFetchingManagerViewDistributionRequest,
  } = useGetManagerViewDistributionRequestQuery({
    page: page,
    pageSize: pageSize,
    status: status,
  });
  const getAdminViewDistributionRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAdminViewDistributionRequest();
  }, [refetchAdminViewDistributionRequest, page, pageSize, status]);
  const getStaffViewDistributionRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchStaffViewDistributionRequest();
  }, [refetchStaffViewDistributionRequest, page, pageSize, status]);
  const getAgencyViewDistributionRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAgencyViewDistributionRequest();
  }, [refetchAgencyViewDistributionRequest, page, pageSize, status]);
  const getManagerViewDistributionRequest = useCallback(() => {
    refetchManagerViewDistributionRequest();
  }, [refetchManagerViewDistributionRequest, page, pageSize, status]);
  const {
    data: adminViewDistributionRequestDetail,
    refetch: refetchAdminViewDistributionRequestDetail,
    isLoading: isLoadingAdminViewDistributionRequestDetail,
  } = useGetAdminViewDistributionRequestDetailQuery({ id: id || "" });
  const {
    data: staffViewDistributionRequestDetail,
    refetch: refetchStaffViewDistributionRequestDetail,
    isLoading: isLoadingStaffViewDistributionRequestDetail,
  } = useGetStaffViewDistributionRequestDetailQuery({ id: id || "" });
  const {
    data: agencyViewDistributionRequestDetail,
    refetch: refetchAgencyViewDistributionRequestDetail,
    isLoading: isLoadingAgencyViewDistributionRequestDetail,
  } = useGetAgencyViewDistributionRequestDetailQuery({ id: id || "" });
  const {
    data: managerViewDistributionRequestDetail,
    refetch: refetchManagerViewDistributionRequestDetail,
    isLoading: isLoadingManagerViewDistributionRequestDetail,
  } = useGetManagerViewDistributionRequestDetailQuery({ id: id || "" });
  const getAdminViewDistributionRequestDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
    }
    refetchAdminViewDistributionRequestDetail();
  }, [refetchAdminViewDistributionRequestDetail, id]);
  const getStaffViewDistributionRequestDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
    }
    refetchStaffViewDistributionRequestDetail();
  }, [refetchStaffViewDistributionRequestDetail, id]);
  const getAgencyViewDistributionRequestDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
    }
    refetchAgencyViewDistributionRequestDetail();
  }, [refetchAgencyViewDistributionRequestDetail, id]);
  const getManagerViewDistributionRequestDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
    }
    refetchManagerViewDistributionRequestDetail();
  }, [refetchManagerViewDistributionRequestDetail, id]);
  const useApproveDistributeRequest = useApproveDistributionRequestMutation();
  const useRejectDistributeRequest = useRejectDistributionRequestMutation();
  const useCancelDistributionRequest = useCancelDistributionRequestMutation();
  const useCreateDistributeRequest = useCreateistributionRequestMutation();
  const useStartTransit = useStartTransitDistributionRequestMutation();
  const useCompleteTransit = useCompleteTransitDistributionRequestMutation();
  const completeDistributeRequest = useCallback(
    async (id:string , data : {completedBikeIds:string[]}) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCompleteTransit.mutateAsync({id,data});
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Nhận xe được điều phối tới trạm thành công");;
          getManagerViewDistributionRequest();
          getManagerViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useCompleteTransit,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const approveDistributeRequest = useCallback(
    async (id:string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useApproveDistributeRequest.mutateAsync(id);
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Duyệt yêu cầu phân bổ thành công");
          getManagerViewDistributionRequest();
          getManagerViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useApproveDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const startTransitDistributionRequest = useCallback(
    async (id:string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useStartTransit.mutateAsync(id);
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Bắt đầu điều phối xe thành công");
          queryClient.invalidateQueries({
            queryKey: ["distribution-request", "all"],
          });
          queryClient.invalidateQueries({
            queryKey: ["manager","distribution-request-data","detail",id],
          });
          queryClient.invalidateQueries({
            queryKey: ["staff","distribution-request-data","detail",id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useApproveDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const rejectDistributeRequest = useCallback(
    async (id:string , data : {reason:string}) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useRejectDistributeRequest.mutateAsync({id,data});
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Từ chối yêu cầu phân bổ thành công");
          getManagerViewDistributionRequest();
          getManagerViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useRejectDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const cancelDistributeRequest = useCallback(
    async (id:string , data : {reason:string}) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCancelDistributionRequest.mutateAsync({id,data});
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Hủy bỏ yêu điều phối xe thành công");
          getStaffViewDistributionRequest();
          getStaffViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useRejectDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const createDistributeRequest = useCallback(
    async (data:CreateRedistributionRequestInput) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCreateDistributeRequest.mutateAsync(data);
        if (result.status === HTTP_STATUS.CREATED) {
          toast.success("Tạo yêu cầu điều phối xe thành công");
          queryClient.invalidateQueries({
            queryKey: ["distribution-request", "all"],
          });
          queryClient.invalidateQueries({
            queryKey: ["manager","distribution-request-data","detail",id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useCreateDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const agencyCompleteDistributeRequest = useCallback(
    async (id:string , data : {completedBikeIds:string[]}) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCompleteTransit.mutateAsync({id,data});
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Nhận xe được điều phối tới trạm thành công");;
          getAgencyViewDistributionRequest();
          getAgencyViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useCompleteTransit,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const agencyApproveDistributeRequest = useCallback(
    async (id:string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useApproveDistributeRequest.mutateAsync(id);
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Duyệt yêu cầu phân bổ thành công");
          getAgencyViewDistributionRequest();
          getAgencyViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useApproveDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const agencyStartTransitDistributionRequest = useCallback(
    async (id:string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useStartTransit.mutateAsync(id);
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Bắt đầu điều phối xe thành công");
          getAgencyViewDistributionRequest();
          getAgencyViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useApproveDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const agencyRejectDistributeRequest = useCallback(
    async (id:string , data : {reason:string}) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useRejectDistributeRequest.mutateAsync({id,data});
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Từ chối yêu cầu phân bổ thành công");
          getAgencyViewDistributionRequest();
          getAgencyViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useRejectDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const agencyCancelDistributeRequest = useCallback(
    async (id:string , data : {reason:string}) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCancelDistributionRequest.mutateAsync({id,data});
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Hủy bỏ yêu điều phối xe thành công");
          getAgencyViewDistributionRequest();
          getAgencyViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useRejectDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  const agencyCreateDistributeRequest = useCallback(
    async (data:CreateRedistributionRequestInput) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCreateDistributeRequest.mutateAsync(data);
        if (result.status === HTTP_STATUS.CREATED) {
          toast.success("Tạo yêu cầu điều phối xe thành công");
          getAgencyViewDistributionRequest();
          getAgencyViewDistributionRequestDetail();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromDistributionRequestCode(error_code));
        throw error;
      }
    },
    [
      useCreateDistributeRequest,
      hasToken,
      router,
      page,
      pageSize,
      status,
      queryClient,
    ],
  );
  return {
    adminViewDistributionRequest,
    refetchAdminViewDistributionRequest,
    isFetchingAdminViewDistributionRequest,
    getAdminViewDistributionRequest,
    staffViewDistributionRequest,
    refetchStaffViewDistributionRequest,
    isFetchingStaffViewDistributionRequest,
    getStaffViewDistributionRequest,
    agencyViewDistributionRequest,
    refetchAgencyViewDistributionRequest,
    isFetchingAgencyViewDistributionRequest,
    getAgencyViewDistributionRequest,
    managerViewDistributionRequest,
    refetchManagerViewDistributionRequest,
    isFetchingManagerViewDistributionRequest,
    getManagerViewDistributionRequest,
    adminViewDistributionRequestDetail,
    refetchAdminViewDistributionRequestDetail,
    isLoadingAdminViewDistributionRequestDetail,
    getAdminViewDistributionRequestDetail,
    staffViewDistributionRequestDetail,
    refetchStaffViewDistributionRequestDetail,
    isLoadingStaffViewDistributionRequestDetail,
    getStaffViewDistributionRequestDetail,
    agencyViewDistributionRequestDetail,
    refetchAgencyViewDistributionRequestDetail,
    isLoadingAgencyViewDistributionRequestDetail,
    getAgencyViewDistributionRequestDetail,
    managerViewDistributionRequestDetail,
    refetchManagerViewDistributionRequestDetail,
    isLoadingManagerViewDistributionRequestDetail,
    getManagerViewDistributionRequestDetail,
    approveDistributeRequest,
    rejectDistributeRequest,
    cancelDistributeRequest,
    createDistributeRequest,
    startTransitDistributionRequest,
    completeDistributeRequest,
    agencyApproveDistributeRequest,
    agencyCancelDistributeRequest,
    agencyCompleteDistributeRequest,
    agencyStartTransitDistributionRequest,
    agencyRejectDistributeRequest,
    agencyCreateDistributeRequest,
  };
};
