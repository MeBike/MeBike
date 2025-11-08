import { useMutation } from "@tanstack/react-query";
import { RejectSOSSchema } from "@/schemas/sosSchema";
import { sosService } from "@/services/sos.service";
export const useRejectSOSRequestMutation = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectSOSSchema }) =>
      sosService.postRejectSOSRequest({ id, data }),
  });
};
