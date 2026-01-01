import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
export const useVerifyForgotPasswordMutation = () => {
    return useMutation({
      mutationFn: ({
        email_forgot_password_token,
        otp,
      }: {
        email_forgot_password_token: string,
        otp : string
     }) => authService.verifyForgotPassword(email_forgot_password_token, otp),
    });
}