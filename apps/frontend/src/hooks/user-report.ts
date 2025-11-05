import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useGetAllManageReportQuery } from "./query/Report/useGetAllReportQuery";
import { useGetReportOverview } from "./query/Report/useGetReportOverview";

export const useUserReport = ({ hasToken }: { hasToken: boolean }) => {
  const queryClient = useQueryClient();
  const {
    data: reports,
    refetch: refetchReports,
    isFetching: isFetchingReports,
  } = useGetAllManageReportQuery();
  const { data: reportOverview , refetch : refetchReportOverview } = useGetReportOverview();
  const refreshReports = useCallback(async () => {
    if (!hasToken) return;
    refetchReports();
  }, [queryClient]);
  const refreshReportOverview = useCallback(async () => {
    if (!hasToken) return;
    refetchReportOverview();
  }, [queryClient]);
  return {
    reports : reports?.data || [],
    refetchReports,
    isFetchingReports,
    refreshReports,
    reportOverview : reportOverview?.result,
    refreshReportOverview,
    pagination : reports?.pagination,
  };
};
