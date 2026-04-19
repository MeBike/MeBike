import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@constants";
const getAgencyRequestDetail = async ({ id }: { id: string }) => {
  try {
    const response = await agencyService.getAgencyRequestDetail({
      id: id,
    });
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch agency request detail");
  }
};
export const useGetAgencyRequestDetail = ({
  id
}: {
  id : string
}) => {
  return useQuery({
    queryKey: ["detail", "agency-request"],
    queryFn: () => getAgencyRequestDetail({ id : id }),
    enabled : false,
  });
};
