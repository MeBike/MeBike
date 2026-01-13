import { authService } from "@services/auth/auth-service";
import { useMutation } from "@tanstack/react-query";

type VerifyEmailOtpPayload = Parameters<typeof authService.verifyEmailOtp>[0];

export function useVerifyEmailOtpMutation() {
  return useMutation({
    mutationFn: (payload: VerifyEmailOtpPayload) =>
      authService.verifyEmailOtp(payload),
    retry: 0,
  });
}
