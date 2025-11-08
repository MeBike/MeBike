import { useGetSOSDetailQuery } from "./query/SOS/useGetSOSDetailQuery";
import { useGetSOSQuery } from "./query/SOS/useGetSOSQuery";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateSOSRequestMutation } from "./mutations/SOS/useCreateSOSRequestMutation";
import {
  CreateSOSSchema,
  ConfirmSOSSchema,
  RejectSOSSchema,
} from "@/schemas/sosSchema";
import { toast } from "sonner";
import { useConfirmSOSRequestMutation } from "./mutations/SOS/usePostConfirmSOSRequestMutation";
import { useRejectSOSRequestMutation } from "./mutations/SOS/usePostRejectSOSRequestMutation";
interface UseSOSProps {
  hasToken: boolean;
  page?: number;
  limit?: number;
  id?: string;
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
export function useSOS({ hasToken, page, limit, id }: UseSOSProps) {
  const queryClient = useQueryClient();
  const {
    data: sosRequests,
    isLoading,
    refetch: refetchSOS,
  } = useGetSOSQuery({ page, limit });
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
  const useCreateSOS = useCreateSOSRequestMutation();
  const createSOS = useCallback(
    (data: CreateSOSSchema) => {
      return new Promise<void>((resolve, reject) => {
        useCreateSOS.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success("SOS request created successfully");
              queryClient.invalidateQueries({
                queryKey: ["sos-requests", { page, limit }],
              });
              resolve();
            } else {
              const errorMessage =
                result.data?.message || "Error creating SOS request";
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "Error creating SOS request"
            );
            toast.error(errorMessage);
            reject(error);
          },
        });
      });
    },
    [useCreateSOS, queryClient, page, limit]
  );
  const useConfirmSOS = useConfirmSOSRequestMutation();
  const confirmSOS = useCallback(
    (data: ConfirmSOSSchema, id: string) => {
      return new Promise<void>((resolve, reject) => {
        useConfirmSOS.mutate(
          { id, data },
          {
            onSuccess: (result) => {
              if (result.status === 200) {
                toast.success("SOS request confirmed successfully");
                queryClient.invalidateQueries({
                  queryKey: ["sos-requests", { page, limit }],
                });
                resolve();
              } else {
                const errorMessage =
                  result.data?.message || "Error confirming SOS request";
                toast.error(errorMessage);
                reject(new Error(errorMessage));
              }
            },
            onError: (error: unknown) => {
              const errorMessage = getErrorMessage(
                error,
                "Error confirming SOS request"
              );
              toast.error(errorMessage);
              reject(error);
            },
          }
        );
      });
    },
    [useConfirmSOS, queryClient, page, limit]
  );
  const useRejectSOS = useRejectSOSRequestMutation();
  const rejectSOS = useCallback(
    (data: RejectSOSSchema, id: string) => {
      return new Promise<void>((resolve, reject) => {
        useRejectSOS.mutate(
          { id, data },
          {
            onSuccess: (result) => {
              if (result.status === 200) {
                toast.success("SOS request rejected successfully");
                queryClient.invalidateQueries({
                  queryKey: ["sos-requests", { page, limit }],
                });
                resolve();
              } else {
                const errorMessage =
                  result.data?.message || "Error rejecting  SOS request";
                toast.error(errorMessage);
                reject(new Error(errorMessage));
              }
            },
            onError: (error: unknown) => {
              const errorMessage = getErrorMessage(
                error,
                "Error rejecting SOS request"
              );
              toast.error(errorMessage);
              reject(error);
            },
          }
        );
      });
    },
    [useRejectSOS, queryClient, page, limit]
  );
  return {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    isLoadingSOSDetail,
    refetchSOSDetail,
    createSOS,
    confirmSOS,
    rejectSOS,
  };
}
