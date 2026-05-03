import { useMutation } from "@tanstack/react-query";
import { nfcService } from "@services/nfc.service";

export const useCreateNFCMutation = () => {
  return useMutation({
    mutationKey: ["create-nfc"],
    mutationFn: async ({ data }: { data: { uid: string } }) =>
      nfcService.createNFC({ data }),
  });
};
