import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useGetAllManageReportQuery } from "./query/Report/useGetAllReportQuery";

export const useUserReport = ({ hasToken }: { hasToken: boolean }) => {
  const queryClient = useQueryClient();
  const {
    data: reports,
    refetch: refetchReports,
    isFetching: isFetchingReports,
  } = useGetAllManageReportQuery();
  const refreshReports = useCallback(async () => {
    if (!hasToken) return;
    refetchReports();
  }, [queryClient]);
  return {
    reports : reports?.data || [],
    refetchReports,
    isFetchingReports,
    refreshReports,
    pagination : reports?.pagination,
  };
};
