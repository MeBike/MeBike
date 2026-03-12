import type {UpdateProfileSchemaFormData} from "@/schemas/auth-schema"
import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
export const useUpdateProfileMutation = () => {
    return useMutation({
      mutationFn: (data: Partial<UpdateProfileSchemaFormData>) =>
        authService.updateProfile(data),
    });
}