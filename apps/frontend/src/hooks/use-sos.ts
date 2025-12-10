import { useGetSOSDetailQuery } from "./query/SOS/useGetSOSDetailQuery";
import { useGetSOSQuery } from "./query/SOS/useGetSOSQuery";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AssignSOSSchema,
  ResolveSOSSchema,
} from "@/schemas/sosSchema";
import { toast } from "sonner";
import { useAssignSOSRequestMutation } from "./mutations/SOS/useAssignSOSRequestMutation";
import { useConfirmSOSRequestMutation } from "./mutations/SOS/useConfirmSOSRequestMutation";
import { useResolveSOSRequestMutation } from "./mutations/SOS/useResolveSOSRequestMutaiton";
import { useCreateRentalSOSRequestMutation } from "./mutations/SOS/useCreateRentalBySOSMutation";
import { useCancelSOSRequestMutation } from "./mutations/SOS/useCancelSOSRequestMutation";
import { QUERY_KEYS , HTTP_STATUS , MESSAGE } from "@constants/index";
interface UseSOSProps {
  hasToken: boolean;
  page?: number;
  limit?: number;
  id?: string;
  status?:
    | "ĐANG CHỜ XỬ LÍ"
    | "ĐÃ GỬI NGƯỜI CỨU HỘ"
    | "ĐANG TRÊN ĐƯỜNG ĐẾN"
    | "ĐÃ XỬ LÍ"
    | "KHÔNG XỬ LÍ ĐƯỢC"
    | "ĐÃ TỪ CHỐI"
    | "ĐÃ HUỶ";
}
interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
}
interface ErrorWithMessage {
  message: string;
}
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
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
};
export function useSOS({ hasToken, page, limit, id , status}: UseSOSProps) {
  const queryClient = useQueryClient();
  const {
    data: sosRequests,
    isLoading,
    refetch: refetchSOS,
  } = useGetSOSQuery({ page, limit , status });
  const {
    data: sosDetail,
    refetch: refetchSOSDetailRequest,
    isLoading: isLoadingSOSDetail,
  } = useGetSOSDetailQuery(id || "");
  const refetchSOSRequest = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    await refetchSOS();
  }, [hasToken, refetchSOS]);
  const refetchSOSDetail = useCallback(async () => {
    if (!hasToken || !id) {
      return;
    }
    await refetchSOSDetailRequest();
  }, [hasToken, id, refetchSOSDetailRequest]);
  const useAssignSOSRequest = useAssignSOSRequestMutation(id || "");
  const assignSOSRequest = useCallback(async (data : AssignSOSSchema) => {
    if (!hasToken || !id) {
      throw new Error("Unauthorized");
    }
    return new Promise((resolve, reject) => {
      useAssignSOSRequest.mutate(
        data,
        {
          onSuccess: async (result: {
            status: number;
            data?: { message?: string };
          }) => {
            if (result.status === HTTP_STATUS.OK) {
              toast.success(
                result.data?.message ||
                  MESSAGE.ASSIGN_SOS_GUEST_SUCCESS
              );
              await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.SOS.ALL(),
              });
              await refetchSOSRequest();
              await refetchSOSDetail();
              resolve(result);
            } else {
              const errorMessage =
                result.data?.message || MESSAGE.ASSIGN_SOS_GUEST_FAILED;
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.ASSIGN_SOS_GUEST_FAILED
            );
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          },
        }
      );
    });
  }, [refetchSOSRequest, refetchSOSDetail, hasToken, id, useAssignSOSRequest, queryClient , page, limit, status]);
  const useConfirmSOSRequest = useConfirmSOSRequestMutation(id || "");
  const confirmSOSRequest = useCallback(
    async () => {
      if (!hasToken) {
        throw new Error("Unauthorized");
      }
      
      return new Promise((resolve, reject) => {
        useConfirmSOSRequest.mutate(undefined, {
          onSuccess: async (result: {
            status: number;
            data?: { message?: string };
          }) => {
            if (result.status === HTTP_STATUS.OK) {
              toast.success(result.data?.message || MESSAGE.ASSIGN_SOS_GUEST_SUCCESS);
              await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.SOS.ALL(),
              });
              await refetchSOSRequest();
              await refetchSOSDetail();
              resolve(result);
            } else {
              const errorMessage = result.data?.message || MESSAGE.ASSIGN_SOS_GUEST_FAILED;
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.ASSIGN_SOS_GUEST_FAILED
            );
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          },
        });
      });
    },
    [
      refetchSOSRequest,
      refetchSOSDetail,
      hasToken,
      useConfirmSOSRequest,
      queryClient,
      page,
      limit,
      status,
    ]
  );
  const useResolveSOSRequest = useResolveSOSRequestMutation(id || "");
  const resolveSOSRequest = useCallback(async (data: ResolveSOSSchema) => {
    if (!hasToken || !id) {
      throw new Error("Unauthorized");
    }
    
    return new Promise((resolve, reject) => {
      useResolveSOSRequest.mutate(data, {
        onSuccess: async (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === 200) {
            toast.success(
              result.data?.message || MESSAGE.RESOLVE_SOS_SUCCESS
            );
            await queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.SOS.ALL(page, limit, status),
            });
            await refetchSOSRequest();
            await refetchSOSDetail();
            resolve(result);
          } else {
            const errorMessage =
              result.data?.message || MESSAGE.RESOLVE_SOS_FAILED;
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            MESSAGE.RESOLVE_SOS_FAILED
          );
          toast.error(errorMessage);
          reject(new Error(errorMessage));
        },
      });
    });
  }, [
    refetchSOSRequest,
    refetchSOSDetail,
    hasToken,
    id,
    useResolveSOSRequest,
    queryClient,
    page,
    limit,
    status
  ]);
  const useCreateRental = useCreateRentalSOSRequestMutation(id || "");
  const createRentalRequest = useCallback(async () => {
    if (!hasToken || !id) {
      throw new Error("Unauthorized");
    }
    
    return new Promise((resolve, reject) => {
      useCreateRental.mutate(undefined, {
        onSuccess: async (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === 200) {
            toast.success(
              result.data?.message || MESSAGE.CREATE_SOS_SUCCESS
            );
            await queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.SOS.ALL(page, limit, status),
            });
            await refetchSOSRequest();
            await refetchSOSDetail();
            resolve(result);
          } else {
            const errorMessage =
              result.data?.message || MESSAGE.CREATE_SOS_FAILED;
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            MESSAGE.CREATE_SOS_FAILED
          );
          toast.error(errorMessage);
          reject(new Error(errorMessage));
        },
      });
    });
  }, [
    refetchSOSRequest,
    refetchSOSDetail,
    hasToken,
    id,
    useCreateRental,
    queryClient,
    page,
    limit,
    status
  ]);
  const useCancelSOSRequest = useCancelSOSRequestMutation(id || "");
  const cancelSOSRequest = useCallback(async (data: { reason: string }) => {
    if (!hasToken || !id) {
      throw new Error("Unauthorized");
    }
    
    return new Promise((resolve, reject) => {
      useCancelSOSRequest.mutate(data, {
        onSuccess: async (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === 200) {
            toast.success(
              result.data?.message || MESSAGE.CANCEL_SOS_SUCCESS
            );
            await queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.SOS.ALL(),
            });
            await refetchSOSRequest();
            await refetchSOSDetail();
            resolve(result);
          } else {
            const errorMessage =
              result.data?.message || MESSAGE.CANCEL_SOS_FAILED;
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            MESSAGE.CANCEL_SOS_FAILED
          );
          toast.error(errorMessage);
          reject(new Error(errorMessage));
        },
      });
    });
  }, [
    refetchSOSRequest,
    refetchSOSDetail,
    hasToken,
    id,
    useCancelSOSRequest,
    queryClient,
    page,
    limit,
    status
  ]);

  return {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    isLoadingSOSDetail,
    refetchSOSDetail,
    confirmSOSRequest,
    assignSOSRequest,
    resolveSOSRequest,
    createRentalRequest,
    cancelSOSRequest,
  };
}
