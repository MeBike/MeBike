import { useGetAgencies, useGetAgencyDetail, useGetAgencyStat } from "@queries";
import {
  useUpdateAgencyStatusMutation,
  useUpdateAgencyMutation,
} from "@mutations";
import { toast } from "sonner";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { UpdateAgencyFormData, UpdateAgencyStatusFormData } from "@/schemas";
import { HTTP_STATUS } from "@/constants";
import { useQueryClient } from "@tanstack/react-query";
import {
  getErrorMessageFromAgencyCode,
  getAxiosErrorCodeMessage,
} from "@utils";
export interface AgencyActionProps {
  hasToken?: boolean;
  agency_id?: string;
  page?: number;
  pageSize?: number;
}
export const useAgencyActions = ({
  hasToken,
  agency_id,
  page,
  pageSize,
}: AgencyActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
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
            queryKey: ["stats", "agency",id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [],
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
            queryKey: ["stats", "agency",id],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromAgencyCode(error_code));
        throw error;
      }
    },
    [],
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
  };
};
