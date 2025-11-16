import { useGetSOSDetailQuery } from "./query/SOS/useGetSOSDetailQuery";
import { useGetSOSQuery } from "./query/SOS/useGetSOSQuery";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AssignSOSSchema,
} from "@/schemas/sosSchema";
import { toast } from "sonner";
import { useAssignSOSRequestMutation } from "./mutations/SOS/useAssignSOSRequestMutation";
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
  const useAssignSOSRequest = useAssignSOSRequestMutation(id || "");
  const assignSOSRequest = useCallback(async (data : AssignSOSSchema) => {
    if (!hasToken || !id) {
      return;
    }
    useAssignSOSRequest.mutate(
      data,
      {
        onSuccess: async (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === 200) {
            toast.success("Assigned SOS request successfully");
            await queryClient.invalidateQueries({
              queryKey: ["sos-requests"],
            });
            await refetchSOSRequest();
            await refetchSOSDetail();
          } else {
            const errorMessage = result.data?.message || "Error updating bikes";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            "Failed to assign SOS request"
          );
          toast.error(errorMessage);
        },
      }
    );
  }, [refetchSOSRequest, refetchSOSDetail, hasToken, id, useAssignSOSRequest, queryClient]);
  return {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    isLoadingSOSDetail,
    refetchSOSDetail,
    assignSOSRequest,
  };
}
