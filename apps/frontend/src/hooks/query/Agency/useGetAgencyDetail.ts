import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@constants";
const getAgencyDetail = async ({ id }: { id: string }) => {
  try {
    const response = await agencyService.getDetailAgency({
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
export const useGetAgencyDetail = ({
  id
}: {
  id : string
}) => {
  return useQuery({
    queryKey: ["detail", "agency"],
    queryFn: () => getAgencyDetail({ id : id }),
    enabled : !!id,
  });
};
