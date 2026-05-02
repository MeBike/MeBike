import { useMutation } from "@tanstack/react-query";
import { nfcService } from "@services/nfc.service";

export const useUnassignNFCMutation = () => {
  return useMutation({
    mutationKey: ["unassign-nfc"],
    mutationFn: async ({ nfcId, userId }: { nfcId: string; userId: string }) =>
      nfcService.unassignNFC({ nfcId, userId }),
  });
};
