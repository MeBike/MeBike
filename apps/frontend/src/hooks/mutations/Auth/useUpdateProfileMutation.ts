import type {UpdateProfileSchemaFormData} from "@schemas/authSchema"
import { authService } from "@services/authService";
import { useMutation } from "@tanstack/react-query";
export const useUpdateProfileMutation = () => {
    return useMutation({
      mutationFn: (data: Partial<UpdateProfileSchemaFormData>) =>
        authService.updateProfile(data),
    });
}