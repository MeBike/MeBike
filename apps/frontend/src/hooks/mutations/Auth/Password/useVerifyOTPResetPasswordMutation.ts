import { authService } from "@/services/auth.service";
import type { VerifyOTPForForgotPasswordSchemaFormData } from "@/schemas/auth-schema";
import { useMutation } from "@tanstack/react-query";
export const useVerifyOTPResetPasswordMutation = () => {
    return useMutation({
        mutationFn: (data: VerifyOTPForForgotPasswordSchemaFormData) => authService.verifyOTP(data),
    })
}