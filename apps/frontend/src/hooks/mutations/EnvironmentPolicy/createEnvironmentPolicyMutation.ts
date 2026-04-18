import { useMutation } from "@tanstack/react-query";
import { environmentService } from "@services/environment.service";
import { CreateEnvironmentPolicyInput } from "@/schemas/environment-policy-schema";
export const useCreateEnvironmentPolicyMutation = () => {
    return useMutation({
        mutationKey: ["create-environment-policy"],
        mutationFn: async (data: CreateEnvironmentPolicyInput) => environmentService.createEnvironmentPolicy(data),
    });
}