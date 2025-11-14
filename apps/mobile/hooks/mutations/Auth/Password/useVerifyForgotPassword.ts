import { useMutation } from "@tanstack/react-query";

import { authService } from "@/services/auth.service";

export function useVerifyForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email_forgot_password_token: string) => authService.verifyForgotPassword(email_forgot_password_token),
  });
}
