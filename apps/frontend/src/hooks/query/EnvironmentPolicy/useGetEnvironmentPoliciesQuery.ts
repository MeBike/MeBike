import { useQuery } from "@tanstack/react-query";
import { environmentService } from "@/services/environment.service";
const getEnvironmentPolicies = async (
  page?: number,
  pageSize?: number,
) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    const response = await environmentService.getEnvironmentPolices(query);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetEnvironmentPoliciesQuery = ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["admin","environment-policy-data"],
    queryFn: () => getEnvironmentPolicies(page, pageSize),
    enabled:false,
  });
};
