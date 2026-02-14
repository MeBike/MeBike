import { useMutation } from "@tanstack/react-query";
import type { ConfirmResetPasswordSchemaFormData } from "@/schemas/authSchema";
import { authService } from "@/services/auth.service";

export const useConfirmResetPasswordMutation = () => {
    return useMutation({
        mutationFn: (data:ConfirmResetPasswordSchemaFormData) => authService.confirmForgotPassword(data),
        retry: 0, 
    })
}