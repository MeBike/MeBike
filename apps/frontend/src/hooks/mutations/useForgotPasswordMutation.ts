import { useMutation } from "@tanstack/react-query";
import type { ForgotPasswordFormData } from "@/schemas/authSchema";
import { authService } from "@services/authService";

export const useForgotPasswordMutation = () => {
    return useMutation({
        mutationFn: (data:ForgotPasswordFormData) => authService.forgotPassword(data),
    })
}