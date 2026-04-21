import { useQuery } from "@tanstack/react-query";
import { environmentService } from "@/services/environment.service";
const getEnvironmentImpacts = async (
  page?: number,
  pageSize?: number,
) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    const response = await environmentService.getEnvironmentImpacts(query);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetEnvironmentImpactsQuery = ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["admin","environment-impacts-data"],
    queryFn: () => getEnvironmentImpacts(page, pageSize),
    enabled:false,
  });
};
