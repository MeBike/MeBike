import {
  useGetAgencies,
  useGetAgencyDetail,
  useGetAgencyStat,
  useGetAgencyRequests,
  useGetAgencyRequestDetail,
} from "@queries";
import {
  useUpdateAgencyStatusMutation,
  useUpdateAgencyMutation,
  useApproveAgencyRequestMutation,
  useCancelAgencyRequestMutation,
  useRegisterAgencyRequestMutation,
  useRejectAgencyRequestMutation,
} from "@mutations";
import { toast } from "sonner";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UpdateAgencyFormData,
  UpdateAgencyStatusFormData,
  RegisterAgencyFormData,
} from "@/schemas";
import { HTTP_STATUS } from "@/constants";
import { useQueryClient } from "@tanstack/react-query";
import {
  getErrorMessageFromAgencyCode,
  getAxiosErrorCodeMessage,
} from "@utils";
import { id } from "date-fns/locale";
export interface AgencyActionProps {
  hasToken?: boolean;
  agency_id?: string;
  page?: number;
  pageSize?: number;
  agency_request_id?:string;
}
export const useAgencyActions = ({
  hasToken,
  agency_id,
  page,
  pageSize,
  agency_request_id
}: AgencyActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: agencyRequest,
    refetch: refetchGetAgencyRequest,
    isLoading: isLoadingAgencyRequest,
  } = useGetAgencyRequests({ page: page, pageSize: pageSize });
  const getAgencyRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetAgencies();
  }, [refetchGetAgencyRequest, hasToken, router, page]);
    const {
    data: agencyRequestDetail,
    refetch: refetchGetAgencyRequestDetail,
    isLoading: isLoadingAgencyRequestDetail,
  } = useGetAgencyRequestDetail({ id:agency_request_id || ""});
  const getAgencyRequestDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetAgencyRequestDetail();
  }, [refetchGetAgencyRequestDetail, hasToken, router, page]);
  const {
    data: agencies,
    refetch: refetchGetAgencies,
    isLoading: isLoadingAgencies,
  } = useGetAgencies({ page: page, pageSize: pageSize });
  const getAgencies = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetAgencies();
  }, [refetchGetAgencies, hasToken, router, page]);
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
    [updateStatusMutation, hasToken, id],
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
    isLoadingAgencyRequestDetail
  };
};
