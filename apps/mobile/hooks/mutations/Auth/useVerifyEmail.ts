import { useMutation } from "@tanstack/react-query";

import { authService } from "@services/auth.service";

export const useVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: ({ otp }: { otp: string }) => authService.verifyEmail({otp}),
    retry: 0, // Không retry khi OTP sai
  });
};
