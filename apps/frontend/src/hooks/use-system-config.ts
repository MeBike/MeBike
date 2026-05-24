

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGetAllSystemConfigsQuery } from "@queries";
import { useUpdateSystemConfigMutation } from "@mutations";
import {HTTP_STATUS} from "@/constants";
import { useCallback } from "react";
import { getErrorMessageFromSupplierCode , getAxiosErrorCodeMessage } from "@utils";
export const useSystemConfigActions = ({hasToken,key} : {hasToken : boolean , key : string}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data : systemConfigs , isLoading , refetch} = useGetAllSystemConfigsQuery();
  const getAllSystemConfigs = useCallback(() => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      refetch();
    }, [refetch, hasToken, router]);
  const updateSystemConfigMutation = useUpdateSystemConfigMutation();
  const updateSystemConfig = useCallback(
    async ({data,key} : {data : {value : string},key : string}) => {
      if (!hasToken) {
        router.push("/login");
      }
      try {
        const result = await updateSystemConfigMutation.mutateAsync({key,value : data.value});
        if(result.status === HTTP_STATUS.OK){
          toast.success("Chính sách đã được cập nhật");
          getAllSystemConfigs();
        }
        return result;
      } catch (error) {
        const code_error = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromSupplierCode(code_error));
        throw error; 
      }
    },
    [hasToken, router, queryClient, updateSystemConfigMutation]
  );
  return {
    systemConfigs,
    isLoading,
    updateSystemConfig,
    getAllSystemConfigs,
    updateSystemConfigMutation,
  };
};
