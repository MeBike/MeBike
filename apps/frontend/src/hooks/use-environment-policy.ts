import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCallback } from "react";
import {
  CreateEnvironmentPolicySchema,
  type CreateEnvironmentPolicyInput,
} from "@/schemas/environment-policy-schema";
import {
  useCreateEnvironmentPolicyMutation,
  useActiveEnvironmentPolicyMutation,
} from "@mutations";
import {
  useGetEnvironmentPoliciesActiveQuery,
  useGetEnvironmentPoliciesQuery,
  useGetEnvironmentImpactsQuery,
  useGetEnvironmentImpactDetailQuery,
} from "@queries";
import { useRouter } from "next/navigation";
import { HTTP_STATUS } from "@constants";
import {
  getErrorMessageFromEnvironmentCode,
  getAxiosErrorCodeMessage,
} from "@utils";

interface EnvironmentPolicyActionProps {
  hasToken: boolean;
  id?: string;
  page?: number;
  pageSize?: number;
}

export const useEnvironmentPolicy = ({
  hasToken,
  id,
  page,
  pageSize,
}: EnvironmentPolicyActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: dataEnvironmentPolicy,
    isLoading: isLoadingEnvironmentPolicy,
    refetch: refetchEnvironmentPolicy,
  } = useGetEnvironmentPoliciesQuery({
    page,
    pageSize,
  });
  const getEnvironmentPolicies = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchEnvironmentPolicy();
  }, [refetchEnvironmentPolicy, page, pageSize]);
  const {
    data: dataEnvironmentPolicyActive,
    isLoading: isLoadingEnvironmentPolicyActive,
    refetch: refetchEnvironmentPolicyActive,
  } = useGetEnvironmentPoliciesActiveQuery({
    page,
    pageSize,
  });
  const getEnvironmentPoliciesActive = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchEnvironmentPolicyActive();
  }, [refetchEnvironmentPolicyActive, page, pageSize]);
  const useCreateEnvironmentPolicy = useCreateEnvironmentPolicyMutation();
  const useActiveEnvironmentPolicy = useActiveEnvironmentPolicyMutation();
  const createEnvironmentPolicty = useCallback(
    async (data: CreateEnvironmentPolicyInput) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCreateEnvironmentPolicy.mutateAsync(data);
        if (result.status === HTTP_STATUS.CREATED) {
          toast.success("Tạo chính sách môi trường thành công");
          queryClient.invalidateQueries({
            queryKey: ["admin", "environment-policy-data"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromEnvironmentCode(error_code));
        throw error;
      }
    },
    [useCreateEnvironmentPolicy, hasToken, router, page, pageSize, queryClient],
  );
  const activeEnvironmentPolicty = useCallback(
    async (id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useActiveEnvironmentPolicy.mutateAsync(id);
        if (result.status === HTTP_STATUS.OK) {
          if (result.data.status === "ACTIVE") {
            toast.success("Kích hoạt chính sách môi trường thành công");
          } else {
            toast.success("Hủy kích hoạt chính sách môi trường thành công");
          }
          getEnvironmentPolicies();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromEnvironmentCode(error_code));
        throw error;
      }
    },
    [useActiveEnvironmentPolicy, hasToken, router, page, pageSize, queryClient],
  );
  const {data:dataEnvironmentImpacts,isLoading:isLoadingEnvironmentImpacts,refetch:refetchEnvironmentImpacts} = useGetEnvironmentImpactsQuery({page:page,pageSize:pageSize});
  const getEnvironmentImpacts = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchEnvironmentImpacts();
  }, [refetchEnvironmentImpacts, page, pageSize]);
  const {data:dataEnvironmentImpactDetail,isLoading:isLoadingEnvironmentImpactDetail,refetch:refetchEnvironmentImpactDetail} = useGetEnvironmentImpactDetailQuery({id:id || ""});
  const getEnvironmentImpactDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchEnvironmentImpactDetail();
  }, [refetchEnvironmentImpactDetail, id]);
  return {
    dataEnvironmentPolicy,
    isLoadingEnvironmentPolicy,
    getEnvironmentPolicies,
    dataEnvironmentPolicyActive,
    isLoadingEnvironmentPolicyActive,
    getEnvironmentPoliciesActive,
    activeEnvironmentPolicty,
    createEnvironmentPolicty,
    dataEnvironmentImpacts,
    isLoadingEnvironmentImpacts,
    getEnvironmentImpacts,
    dataEnvironmentImpactDetail,
    isLoadingEnvironmentImpactDetail,
    getEnvironmentImpactDetail,
  };
};
