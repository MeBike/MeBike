import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";

export const useResendVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: (data: { email?: string; fullName?: string; userId?: string }) =>
      authService.resendVerifyEmail({ data }),
  });
};
