import { reportService } from "@/services/report.service";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKey";
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
    queryKey: QUERY_KEYS.REPORT.REPORT_OVERVIEW,
    queryFn: getReportOverview,
    enabled: false,
  });
}
