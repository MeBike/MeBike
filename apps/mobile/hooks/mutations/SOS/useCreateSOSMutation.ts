import { useMutation } from "@tanstack/react-query";
import { sosService } from "@/services/sos.service";
import { CreateSOSSchema } from "@/schema/sosSchema";

export const useCreateSOSMutation = () => {
  return useMutation({
    mutationKey: ["create-rental-sos"],
    mutationFn: (data : CreateSOSSchema) => sosService.createSOS(data),
  });
};
