import { useMutation } from "@tanstack/react-query";
import { environmentService } from "@services/environment.service";
export const useActiveEnvironmentPolicyMutation = () => {
    return useMutation({
        mutationKey: ["active-environment-policy"],
        mutationFn: async (id: string) => environmentService.patchActiveEnvironmentPolicy(id),
    });
}