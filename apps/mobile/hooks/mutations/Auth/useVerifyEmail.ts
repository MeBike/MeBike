import { useMutation } from "@tanstack/react-query";

import { authService } from "@services/auth.service";

export const useVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => authService.verifyEmail({email, otp}),
    retry: 0, // Không retry khi OTP sai
  });
};
