import { useQuery } from "@tanstack/react-query";
import { nfcService } from "@/services/nfc.service";
import { HTTP_STATUS } from "@/constants";
const getListNFC = async ({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) => {
  try {
    const response = await nfcService.getListNFC({ page, pageSize });
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch list NFC");
  }
};
export const useGetListNFCQuery = ({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) => {
  return useQuery({
    queryKey: ["data","nfc-list",page,pageSize],
    queryFn: () => getListNFC({page,pageSize}),
  });
};
