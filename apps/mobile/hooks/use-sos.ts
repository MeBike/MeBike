import { useGetSOSDetailQuery } from "./query/SOS/useGetSOSDetailQuery";
import { useGetSOSQuery } from "./query/SOS/useGetSOSQuery";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AssignSOSSchema, CreateSOSSchema, ResolveSOSSchema } from "@/schema/sosSchema";
import { useAssignSOSRequestMutation } from "./mutations/SOS/useAssignSOSRequestMutation";
import { useConfirmSOSRequestMutation } from "./mutations/SOS/useConfirmSOSRequestMutation";
import { useResolveSOSRequestMutation } from "./mutations/SOS/useResolveSOSRequestMutaiton";
import { useCreateRentalSOSRequestMutation } from "./mutations/SOS/useCreateRentalBySOSMutation";
import { useCreateSOSMutation } from "./mutations/SOS/useCreateSOSMutation";
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
  const assignSOSRequest = useCallback(
    async (data: AssignSOSSchema) => {
      if (!hasToken || !id) {
        return;
      }
      useAssignSOSRequest.mutate(data, {
        onSuccess: async (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === 200) {
            alert("Assigned SOS request successfully");
            await queryClient.invalidateQueries({
              queryKey: ["sos-requests"],
            });
            await refetchSOSRequest();
            await refetchSOSDetail();
          } else {
            const errorMessage = result.data?.message || "Error updating bikes";
            alert(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            "Failed to assign SOS request"
          );
          alert(errorMessage);
        },
      });
    },
    [
      refetchSOSRequest,
      refetchSOSDetail,
      hasToken,
      id,
      useAssignSOSRequest,
      queryClient,
    ]
  );
  const useConfirmSOSRequest = useConfirmSOSRequestMutation(id || "");
  const confirmSOSRequest = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    useConfirmSOSRequest.mutate(undefined, {
      onSuccess: async (result: {
        status: number;
        data?: { message?: string };
      }) => {
        if (result.status === 200) {
          alert(
            result.data?.message || "Confirmed SOS request successfully"
          );
          await queryClient.invalidateQueries({
            queryKey: ["sos-requests"],
          });
          await refetchSOSRequest();
          await refetchSOSDetail();
        } else {
          const errorMessage =
            result.data?.message || "Error confirming SOS request";
          alert(errorMessage);
        }
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(
          error,
          "Failed to assign SOS request"
        );
        alert(errorMessage);
      },
    });
  }, [
    refetchSOSRequest,
    refetchSOSDetail,
    hasToken,
    id,
    useAssignSOSRequest,
    queryClient,
  ]);
  const useResolveSOSRequest = useResolveSOSRequestMutation(id || "");
  const resolveSOSRequest = useCallback(
    async (data: ResolveSOSSchema) => {
      if (!hasToken || !id) {
        return;
      }
      useResolveSOSRequest.mutate(data, {
        onSuccess: async (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result.status === 200) {
            alert(
              result.data?.message || "Resolved SOS request successfully"
            );
            await queryClient.invalidateQueries({
              queryKey: ["sos-requests"],
            });
            await refetchSOSRequest();
            await refetchSOSDetail();
          } else {
            const errorMessage =
              result.data?.message || "Error resolving SOS request";
            alert(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            "Failed to resolve SOS request"
          );
          alert(errorMessage);
        },
      });
    },
    [
      refetchSOSRequest,
      refetchSOSDetail,
      hasToken,
      id,
      useResolveSOSRequest,
      queryClient,
    ]
  );
  const useCreateRental = useCreateRentalSOSRequestMutation(id || "");
  const createRentalRequest = useCallback(async () => {
    if (!hasToken || !id) {
      return;
    }
    useCreateRental.mutate(undefined, {
      onSuccess: async (result: {
        status: number;
        data?: { message?: string };
      }) => {
        if (result.status === 200) {
          alert(result.data?.message || "Tạo thuê xe thành công");
          await queryClient.invalidateQueries({
            queryKey: ["sos-requests"],
          });
          await refetchSOSRequest();
          await refetchSOSDetail();
        } else {
          const errorMessage = result.data?.message || "Lỗi khi tạo thuê xe";
          alert(errorMessage);
        }
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(
          error,
          "Failed to create rental request"
        );
        alert(errorMessage);
      },
    });
  }, [
    refetchSOSRequest,
    refetchSOSDetail,
    hasToken,
    id,
    useCreateRental,
    queryClient,
  ]);
  const useCreateSOS = useCreateSOSMutation();
  const createSOSRequest = useCallback(async (data: CreateSOSSchema) => {
    if (!hasToken) {
      return;
    }
    useCreateSOS.mutate(data, {
      onSuccess: async (result: {
        status: number;
        data?: { message?: string };
      }) => {
        if (result.status === 200) {
          // alert(result.data?.message || "Tạo yêu cầu SOS thành công");
          await queryClient.invalidateQueries({
            queryKey: ["sos-requests"],
          });
          await refetchSOSRequest();
          await refetchSOSDetail();
        } else {
          const errorMessage = result.data?.message || "Lỗi khi tạo yêu cầu SOS";
          alert(errorMessage);
        }
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(
          error,
          "Failed to create SOS request"
        );
        alert(errorMessage);
      },
    });
  }, [
    refetchSOSRequest,
    refetchSOSDetail,
    hasToken,
    id,
    useCreateRental,
    queryClient,
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
    createSOSRequest,
  };
}
