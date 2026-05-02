import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAllPricingPoliciesQuery,
  useGetPricingPolicyDetailQuery,
} from "@queries";
import {
  useCreatePricingPolicyMutation,
  useActivePricingPolicyMutation,
  useUpdatePricingPolicyMutation
} from "@mutations";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PricingPolicyStatus } from "@/types";
import { HTTP_STATUS } from "@/constants";
import { toast } from "sonner";
import {
  CreatePricingPolicyFormData,
  UpdatePricingPolicyFormData,
} from "@/schemas/pricing-schema";
import {
  getErrorMessageFromPricingCode,
  getAxiosErrorCodeMessage,
} from "@utils";
export interface PricingPolicyActionProps {
  page?: number;
  pageSize?: number;
  status?: PricingPolicyStatus;
  id?: string;
}
export const usePricingPolicyActions = ({
  page,
  pageSize,
  status,
  id,
}: PricingPolicyActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: pricingPolicies,
    refetch: refetchGetPricingPolicies,
    isLoading: isLoadingPricingPolicies,
  } = useGetAllPricingPoliciesQuery({
    page,
    pageSize,
    status,
  });
  const getPricingPolicies = useCallback(() => {
    refetchGetPricingPolicies();
  }, [refetchGetPricingPolicies]);
  const {
    data: pricingPolicyDetail,
    refetch: refetchGetPricingPolicyDetail,
    isLoading: isLoadingPricingPolicyDetail,
  } = useGetPricingPolicyDetailQuery({ id: id || "" });
  const getPricingPolicyDetail = useCallback(() => {
    refetchGetPricingPolicyDetail();
  }, [refetchGetPricingPolicyDetail]);
  const useCreatePricingPolicy = useCreatePricingPolicyMutation();
  const useActivePricingPolicy = useActivePricingPolicyMutation();
  const useUpdatePricingPolicy = useUpdatePricingPolicyMutation();
  const createPricingPolicy = useCallback(async (data: CreatePricingPolicyFormData) => {
    try {
      const result = await useCreatePricingPolicy.mutateAsync(data);
      if (result.status === HTTP_STATUS.CREATED) {
        toast.success("Tạo chính sách giá thành công");
        // queryClient.invalidateQueries({
        //   queryKey: ["data", "pricing-policy"],
        // });
        getPricingPolicies();
      }
    } catch (error) {
      const error_code = getAxiosErrorCodeMessage(error);
      toast.error(getErrorMessageFromPricingCode(error_code));
      throw error;
    }
  }, [useCreatePricingPolicy, refetchGetPricingPolicies]);
  const activePricingPolicy = useCallback(async (id: string) => {
    try {
      const result = await useActivePricingPolicy.mutateAsync(id);
      if (result.status === HTTP_STATUS.OK) {
        toast.success("Kích hoạt chính sách giá thành công");
        refetchGetPricingPolicies();
        refetchGetPricingPolicyDetail();
      }
    } catch (error) {
      const error_code = getAxiosErrorCodeMessage(error);
      toast.error(getErrorMessageFromPricingCode(error_code));
      throw error;
    }
  }, [useActivePricingPolicy, refetchGetPricingPolicies]);
  const updatePricingPolicy = useCallback(async ({id, data}: {id: string, data: UpdatePricingPolicyFormData}) => {
    try {
      const result = await useUpdatePricingPolicy.mutateAsync({id, data});
      if (result.status === HTTP_STATUS.OK) {
        toast.success("Cập nhật chính sách giá thành công");
        refetchGetPricingPolicies();
        refetchGetPricingPolicyDetail();
      }
    } catch (error) {
      const error_code = getAxiosErrorCodeMessage(error);
      toast.error(getErrorMessageFromPricingCode(error_code));
      throw error;
    }
  }, [useUpdatePricingPolicy, refetchGetPricingPolicies]);
  return {
    pricingPolicies,
    getPricingPolicies,
    isLoadingPricingPolicies,
    pricingPolicyDetail,
    getPricingPolicyDetail,
    isLoadingPricingPolicyDetail,
    createPricingPolicy,
    activePricingPolicy,
    updatePricingPolicy,
    isCreating: useCreatePricingPolicy.isPending,
    isActivating: useActivePricingPolicy.isPending,
    isUpdating: useUpdatePricingPolicy.isPending,
  };
};
