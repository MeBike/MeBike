import { useQuery } from "@tanstack/react-query";
import { sosService } from "@/services/sos.service";
const fetchSOSDetail = async (id: string) => {
  const response = await sosService.getDetailSOSRequest(id);
  return response.data;
}
export function useGetSOSDetailQuery(id: string) {
  return useQuery({
    queryKey: ["sos-detail", id],
    queryFn: () => fetchSOSDetail(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}