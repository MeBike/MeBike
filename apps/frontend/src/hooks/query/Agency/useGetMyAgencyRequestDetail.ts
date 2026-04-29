import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@constants";
const getMyAgencyRequestDetail = async ({ id }: { id: string }) => {
  try {
    const response = await agencyService.getMyAgencyRequestDetail({
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
export const useGetMyAgencyRequestDetail = ({
  id
}: {
  id : string
}) => {
  return useQuery({
    queryKey: ["detail", "my-agency-request",id],
    queryFn: () => getMyAgencyRequestDetail({ id : id }),
    enabled : false,
  });
};
