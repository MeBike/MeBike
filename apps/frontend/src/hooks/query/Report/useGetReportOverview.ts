import { reportService } from "@/services/report.service";
import { useQuery } from "@tanstack/react-query";
const getReportOverview = async () => {
  try {
    const response = await reportService.getOverview();
    return response.data;
  } catch (error) {
    throw error;
  }
};
export function useGetReportOverview() {
    return useQuery({
    queryKey: ["report-overview"],
    queryFn: getReportOverview,
  });
}
