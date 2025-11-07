import { useMutation } from "@tanstack/react-query";
import { CreateSOSSchema } from "@/schemas/sosSchema";
import { sosService } from "@/services/sos.service";
export const useCreateSOSRequestMutation = () => {
  return useMutation({
    mutationFn: (data: CreateSOSSchema) => sosService.postCreateSOSRequest(data),
  });
};
