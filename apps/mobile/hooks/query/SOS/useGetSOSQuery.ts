import { sosService } from "@/services/sos.service";
import { useQuery } from "@tanstack/react-query";
const fetchAllSOS = async ({
  page,
  limit,
  status,
}: {
  page?: number;
  limit?: number;
  status?:
    | "ĐANG CHỜ XỬ LÍ"
    | "ĐÃ GỬI NGƯỜI CỨU HỘ"
    | "ĐANG TRÊN ĐƯỜNG ĐẾN"
    | "ĐÃ XỬ LÍ"
    | "KHÔNG XỬ LÍ ĐƯỢC"
    | "ĐÃ TỪ CHỐI"
    | "ĐÃ HUỶ";
}) => {
  const response = await sosService.getSOSRequest({ page, limit, status });
  return response.data;
};
export function useGetSOSQuery({ page, limit, status }: { page?: number; limit?: number; status?: "ĐANG CHỜ XỬ LÍ" | "ĐÃ GỬI NGƯỜI CỨU HỘ" | "ĐANG TRÊN ĐƯỜNG ĐẾN" | "ĐÃ XỬ LÍ" | "KHÔNG XỬ LÍ ĐƯỢC" | "ĐÃ TỪ CHỐI" | "ĐÃ HUỶ" }) {
  return useQuery({
    queryKey: ["sos-requests", { page, limit, ...(status !== undefined && { status }) }],
    queryFn: () => fetchAllSOS({ page, limit, status }),
    staleTime: 1000 * 60 * 5,
  });
}