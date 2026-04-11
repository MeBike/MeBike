import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@constants";
const getAgencyStat = async ({ id }: { id: string }) => {
  try {
    const response = await agencyService.getAgencyStats({
      id: id,
    });
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch agencies");
  }
};
export const useGetAgencyStat = ({
  id
}: {
  id : string
}) => {
  return useQuery({
    queryKey: ["stats", "agency"],
    queryFn: () => getAgencyStat({ id : id }),
    enabled : !!id,
  });
};
