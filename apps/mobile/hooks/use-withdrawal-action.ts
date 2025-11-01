import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
        .then(res => res.data),
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
      withdrawalsService.createWithdrawRequest(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawalRequests"] });
    },
  });

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const withdrawalRequests = withdrawalRequestsData?.pages
    .flatMap(page => page.data)
    .map(item => ({
      ...item,
      amount: Number(item.amount.$numberDecimal),
    })) || [];
  const totalWithdrawals = withdrawalRequestsData?.pages[0]?.pagination?.totalRecords || 0;

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
