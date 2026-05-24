import { useQuery } from "@tanstack/react-query";
import { configService } from "@/services/config.service";

const getAllSystemConfigs = async () => {
  try {
    const response = await configService.getAllSystemConfigs();
    if(response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching system configs:", error);
    throw error;
  }
};

export const useGetAllSystemConfigsQuery = () => {
  return useQuery({
    queryKey: ["data","system-configs"],
    queryFn: getAllSystemConfigs,
    staleTime: 5 * 60 * 1000, 
    retry: 1,
  });
};