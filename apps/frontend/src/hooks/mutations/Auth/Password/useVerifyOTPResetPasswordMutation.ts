import { authService } from "@/services/auth.service";
import type { VerifyOTPForForgotPasswordSchemaFormData } from "@/schemas/authSchema";
import { useMutation } from "@tanstack/react-query";
export const useVerifyOTPResetPasswordMutation = () => {
    return useMutation({
        mutationFn: (data: VerifyOTPForForgotPasswordSchemaFormData) => authService.verifyOTP(data),
    })
}