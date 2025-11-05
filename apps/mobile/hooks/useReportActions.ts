import { useInfiniteQuery } from "@tanstack/react-query";

import { useCreateReport } from "@hooks/mutations/Report/useCreateReport";
import { reportService } from "@services/report.service";
import type { CreateReportData, Report } from "@services/report.service";
import { useCallback } from "react";
export function useReportActions({limit}: {limit?: number}) {
  const createReportMutation = useCreateReport();
  const {
    data: userReportsData,
    isLoading: isLoadingUserReports,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchUserReports,
  } = useInfiniteQuery({
    queryKey: ["reports", "user"],
    queryFn: ({ pageParam = 1 }) => reportService.getUserReports({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.pagination;
      if (pagination && pagination.currentPage < pagination.totalPages) {
        return pagination.currentPage + 1;
      }
      return undefined;
    },
  });

  const createReport = (
    data: CreateReportData,
    options?: {
      onSuccess?: (data: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    createReportMutation.mutate(data, {
      onSuccess: (response) => {
        options?.onSuccess?.(response);
        refetchUserReports();
      },
      onError: options?.onError,
    });
  };

  const userReports = userReportsData?.pages.flatMap(page => page.data.data) || [];

  return {
    userReports,
    isLoadingUserReports,
    createReport,
    isCreatingReport: createReportMutation.isPending,
    refetchUserReports,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}