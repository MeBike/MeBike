import { useQuery } from "@tanstack/react-query";
import { nfcService } from "@/services/nfc.service";
import { HTTP_STATUS } from "@/constants";
const getNFCDetail = async ({
  id
}: {
  id: string;
}) => {
  try {
    const response = await nfcService.getListNFCDetail({ nfcId : id });
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch NFC detail");
  }
};
export const useGetNFCDetailQuery = ({
  id,
}: {
  id: string;
}) => {
  return useQuery({
    queryKey: ["data","nfc-detail",id],
    queryFn: () => getNFCDetail({id}),
  });
};
