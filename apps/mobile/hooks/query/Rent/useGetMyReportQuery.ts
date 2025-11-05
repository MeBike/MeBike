import { useQuery } from "@tanstack/react-query";
import { reportService } from "@services/report.service";
const getMyQuery = async ({
  page,
  limit,
}: {
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await reportService.getUserReports({
      page,
      limit,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user reports:", error);
    throw error;
  }
};
export function useGetMyReportQuery({
  page,
  limit,
}: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["reports", "my", page, limit],
    queryFn: () => getMyQuery({ page, limit }),
  });
}
