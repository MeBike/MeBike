import { sosService } from "@/services/sos.service";
import { useQuery } from "@tanstack/react-query";
const fetchAllSOS = async ({ page, limit } : { page?: number; limit?: number }) => {
  const response = await sosService.getSOSRequest({ page, limit });
  return response.data;
}
export function useGetSOSQuery({ page, limit }: { page?: number; limit?: number }  ) {
  return useQuery({
    queryKey: ["sos-requests", { page, limit }],
    queryFn: () => fetchAllSOS({ page, limit }),
    staleTime: 1000 * 60 * 5,
  });
}