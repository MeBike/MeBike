import { authService } from "@/services/auth.service";
import type { ForgotPasswordSchemaFormData } from "@/schemas/auth-schema";
import { useMutation } from "@tanstack/react-query";
export const useForgotPasswordMutation = () => {
    return useMutation({
        mutationFn: (data: ForgotPasswordSchemaFormData) => authService.forgotPassword(data),
    })
}