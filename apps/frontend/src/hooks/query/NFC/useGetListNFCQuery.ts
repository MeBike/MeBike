import { useQuery } from "@tanstack/react-query";
import { nfcService } from "@/services/nfc.service";
import { HTTP_STATUS } from "@/constants";
import { AssetStatus } from "@/types";
const getListNFC = async ({
  page,
  pageSize,
  status
}: {
  page: number;
  pageSize: number;
  status: AssetStatus | "all";
}) => {
  try {
    const query : Record<string,number|string> = {
      page : page ?? 1,
      pageSize : pageSize ??7,
    }
    if(status && status !== "all") query.status = status
    const response = await nfcService.getListNFC(query);
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
  status
}: {
  page: number;
  pageSize: number;
  status: AssetStatus | "all";
}) => {
  return useQuery({
    queryKey: ["data","nfc-list",page,pageSize,status],
    queryFn: () => getListNFC({page,pageSize,status}),
  });
};
