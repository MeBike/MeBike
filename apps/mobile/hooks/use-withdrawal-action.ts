import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { CreateWithdrawSchemaFormData } from "../../frontend/src/schemas/withdrawalSchema";
// import type { DetailWithdrawRequest } from "../types/Withdrawal";

import { withdrawalsService } from "../services/withdraw.service";

type _ApiResponse<T> = {
  data: T[];
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
};

interface ErrorWithMessage {
  message: string;
}
interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
      error?: string;
    };
  };
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const data = axiosError.response.data;
    const { errors, message, error: errorField } = data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg) return firstError.msg;
    }
    if (message) return message;
    if (errorField) return errorField;
    // If data is a string, return it
    if (typeof data === "string") return data;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }
  return defaultMessage;
};
export function useWithdrawalAction() {
  const queryClient = useQueryClient();
  const limit = 5;

  const {
    data: withdrawalRequestsData,
    isLoading: isLoadingWithdrawals,
    refetch: refetchWithdrawals,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["withdrawalRequests"],
    queryFn: ({ pageParam = 1 }) =>
      withdrawalsService
        .getWithdrawRequests({ page: pageParam, limit })
        .then((res) => res.data),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: (data: CreateWithdrawSchemaFormData) =>
      withdrawalsService.createWithdrawRequest(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawalRequests"] });
      alert("Yêu cầu rút tiền đã được gửi!");
    },
    onError: (error) => {
      const message = getErrorMessage(
        error,
        "Đã có lỗi xảy ra khi tạo yêu cầu rút tiền."
      );
      alert(message);
    },
  });

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const withdrawalRequests =
    withdrawalRequestsData?.pages
      .flatMap((page) => page.data)
      .map((item) => ({
        ...item,
      })) || [];
  const totalWithdrawals =
    withdrawalRequestsData?.pages[0]?.pagination?.totalRecords || 0;

  return {
    withdrawalRequests,
    isLoadingWithdrawals,
    refetchWithdrawals,
    createWithdrawal: createWithdrawalMutation.mutate,
    isCreating: createWithdrawalMutation.isPending,
    createError: createWithdrawalMutation.error,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    totalWithdrawals,
  };
}
