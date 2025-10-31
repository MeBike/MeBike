import { useQuery } from "@tanstack/react-query";

import { useCreateReport } from "@hooks/mutations/Report/useCreateReport";
import { reportService } from "@services/report.service";
import type { CreateReportData, Report } from "@services/report.service";

export function useReportActions() {
  const createReportMutation = useCreateReport();

  const {
    data: userReportsData,
    isLoading: isLoadingUserReports,
    refetch: refetchUserReports,
  } = useQuery({
    queryKey: ["reports", "user"],
    queryFn: () => reportService.getUserReports(),
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

  return {
    userReports: userReportsData?.data?.data || [],
    isLoadingUserReports,
    createReport,
    isCreatingReport: createReportMutation.isPending,
    refetchUserReports,
  };
}