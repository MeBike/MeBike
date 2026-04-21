import { useQuery } from "@tanstack/react-query";
import { environmentService } from "@/services/environment.service";
const getEnvironmentImpactDetail = async (
  id: string,
) => {
  try {
    const response = await environmentService.getEnvironmentImpactDetail({id:id});
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch environment impact detail");
  }
};
export const useGetEnvironmentImpactDetailQuery = ({
  id,
}: {
  id: string;
}) => {
  return useQuery({
    queryKey: ["admin","environment-impact-detail",id],
    queryFn: () => getEnvironmentImpactDetail(id),
    enabled:false,
  });
};
