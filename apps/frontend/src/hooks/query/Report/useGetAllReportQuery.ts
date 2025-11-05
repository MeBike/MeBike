import { reportService } from "@/services/report.service";
import { useQuery } from "@tanstack/react-query";

const getAllManageReport = async () => {
  const response = await reportService.getManageUserReports();
  return response.data;
}
export const useGetAllManageReportQuery = () => {
  return useQuery({
    queryKey: ["manage-user-reports"],
    queryFn: getAllManageReport,
    staleTime: 5 * 60 * 1000,
  });
}