import { useQuery } from "@tanstack/react-query";
import { reportService } from "@services/report.service";
export const useGetReportById = (reportId: string) => {
  return useQuery({
    queryKey: ["report", reportId],
    queryFn: () => reportService.getReportById(reportId),
    enabled: !!reportId,
    });
};