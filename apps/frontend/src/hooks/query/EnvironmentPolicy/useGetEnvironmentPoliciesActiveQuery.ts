import { useQuery } from "@tanstack/react-query";
import { environmentService } from "@/services/environment.service";
const getEnvironmentPoliciesActive = async (
  page?: number,
  pageSize?: number,
) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    const response = await environmentService.getEnvironmentPolicesActive(query);
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetEnvironmentPoliciesActiveQuery = ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["admin","environment-policy-active-data"],
    queryFn: () => getEnvironmentPoliciesActive(page, pageSize),
    enabled:false,
  });
};
