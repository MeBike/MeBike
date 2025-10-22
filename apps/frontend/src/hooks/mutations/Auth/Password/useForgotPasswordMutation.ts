import { authService } from "@/services/auth.service";
import type { ForgotPasswordSchemaFormData } from "@/schemas/authSchema";
import { useMutation } from "@tanstack/react-query";
export const useForgotPasswordMutation = () => {
    return useMutation({
        mutationFn: (data: ForgotPasswordSchemaFormData) => authService.forgotPassword(data),
    })
}