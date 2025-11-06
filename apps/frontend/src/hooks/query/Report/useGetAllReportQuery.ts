import { reportService } from "@/services/report.service";
import { useQuery } from "@tanstack/react-query";

const getAllManageReport = async ({
  page , limit
}: {page ?: number , limit ?: number
}) => {
  const response = await reportService.getManageUserReports({
    page,
    limit
  });
  return response.data;
}
export const useGetAllManageReportQuery = ({ page , limit }: { page ?: number , limit ?: number }) => {
  return useQuery({
    queryKey: ["all", "report" , { page, limit }],
    queryFn: () => getAllManageReport({ page, limit }),
    staleTime: 5 * 60 * 1000,
  });
}