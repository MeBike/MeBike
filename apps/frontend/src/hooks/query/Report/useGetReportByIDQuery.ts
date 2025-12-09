import { reportService } from "@/services/report.service";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@constants/queryKey";
const getReportById = async ({
  id
}: {
    id: string;
}) => {
  const response = await reportService.getReportById(id);
  return response.data;
};
export const useGetReportByIdQuery = ({
  id,
}: {
    id: string;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.REPORT.DETAIL_REPORT(id),
    queryFn: () => getReportById({ id }),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
