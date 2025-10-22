import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import type {  ChangePasswordSchemaFormData } from "@/schemas/authSchema";
export const useChangePasswordMutation = () => {
    return useMutation({
        mutationFn: (data: ChangePasswordSchemaFormData) => authService.changePassword(data),
    })
}