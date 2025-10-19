import { authService } from "@/services/authService";
import { useMutation } from "@tanstack/react-query";
export const useVerifyForgotPasswordMutation = () => {
    return useMutation({
        mutationFn: (email_forgot_password_token : string) => authService.verifyForgotPassword(email_forgot_password_token),
    })
}