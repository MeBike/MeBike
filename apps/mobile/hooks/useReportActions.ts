import { useInfiniteQuery } from "@tanstack/react-query";

import { useCreateReport } from "@hooks/mutations/Report/useCreateReport";
import { reportService } from "@services/report.service";
import type { CreateReportData, Report } from "@services/report.service";
import { useCallback } from "react";
import { useGetReportById } from "./query/Report/useGetReportById";
export function useReportActions({ page, limit , id}: { page?: number; limit?: number; id?: string }) {
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
    queryFn: () =>
      reportService.getUserReports({ page, limit }),
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
  const {data: reportDetailData , isLoading: isLoadingReportDetail , refetch: refetchReportDetail } = useGetReportById(id || "");
  return {
    userReports,
    isLoadingUserReports,
    createReport,
    isCreatingReport: createReportMutation.isPending,
    refetchUserReports,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    reportDetailData: reportDetailData?.data,
    isLoadingReportDetail,
    refetchReportDetail,
  };
}