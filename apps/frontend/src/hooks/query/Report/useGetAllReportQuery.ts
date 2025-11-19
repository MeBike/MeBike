import { reportService } from "@/services/report.service";
import { useQuery } from "@tanstack/react-query";
import { ReportStatus } from "@/types";
const getAllManageReport = async ({
  page , limit , status
}: {page ?: number , limit ?: number , status ?: ReportStatus
}) => {
  const response = await reportService.getManageUserReports({
    page,
    limit,
    status
  });
  return response.data;
}
export const useGetAllManageReportQuery = ({ page , limit , status }: { page ?: number , limit ?: number , status ?: ReportStatus }) => {
  return useQuery({
    queryKey: ["all", "report" , { page, limit ,status}],
    queryFn: () => getAllManageReport({ page, limit, status }),
    staleTime: 5 * 60 * 1000,
  });
}