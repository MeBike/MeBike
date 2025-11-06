import { useMutation } from "@tanstack/react-query";
import type { ResetPasswordSchemaFormData } from "@/schemas/authSchema";
import { authService } from "@/services/auth.service";

export const useResetPasswordMutation = () => {
    return useMutation({
        mutationFn: (data:ResetPasswordSchemaFormData) => authService.resetPassword(data),
        retry: 0, // Không retry khi OTP sai
    })
}