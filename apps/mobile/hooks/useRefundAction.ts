import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { refundService } from "../services/refund.service";
import type { CreateRefundSchemaFormData } from "@schemas/refundSchema";
import type { RefundRequest } from "../types/RefundType";

interface ApiResponse<T> {
  data: T[];
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
}

export function useRefundAction() {
  const queryClient = useQueryClient();
  const limit = 5;

  const {
    data: refundRequestsData,
    isLoading: isLoadingRefunds,
    refetch: refetchRefunds,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["refundRequests"],
    queryFn: ({ pageParam = 1 }) =>
      refundService
        .getUserRefundRequests({ page: pageParam, limit })
        .then((res) => res.data),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const createRefundMutation = useMutation({
    mutationFn: (data: CreateRefundSchemaFormData) =>
      refundService.createRefundRequest(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refundRequests"] });
    },
  });

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const refundRequests = refundRequestsData?.pages.flatMap(page => page.data) || [];
  const totalRefunds = refundRequestsData?.pages[0]?.pagination?.totalRecords || 0;

  return {
    refundRequests,
    isLoadingRefunds,
    refetchRefunds,
    createRefund: createRefundMutation.mutate,
    isCreating: createRefundMutation.isPending,
    createError: createRefundMutation.error,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    totalRefunds,
  };
}