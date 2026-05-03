import { useMutation } from "@tanstack/react-query";
import { nfcService } from "@services/nfc.service";

export const useAssignNFCMutation = () => {
  return useMutation({
    mutationKey: ["assign-nfc"],
    mutationFn: async ({ nfcId, userId }: { nfcId: string; userId: string }) =>
      nfcService.assignNFC({ nfcId, userId }),
  });
};
