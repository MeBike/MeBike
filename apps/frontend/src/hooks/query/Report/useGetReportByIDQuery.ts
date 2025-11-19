import { reportService } from "@/services/report.service";
import { useQuery } from "@tanstack/react-query";

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
    queryKey: ["report", { id }],
    queryFn: () => getReportById({ id }),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
