import { useMutation } from "@tanstack/react-query";
import { nfcService } from "@services/nfc.service";
import type { AssetStatus } from "@/types";
export const useUpdateStatusNFCMutation = () => {
  return useMutation({
    mutationKey: ["update-status-nfc"],
    mutationFn: async ({nfcId,data,}: {
      nfcId: string;
      data: {
        status: AssetStatus;
      };
    }) => nfcService.updateCardStatus({ nfcId, data }),
  });
};
