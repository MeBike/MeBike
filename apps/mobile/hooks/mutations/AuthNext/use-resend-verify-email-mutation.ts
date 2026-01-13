import { authService } from "@services/auth/auth-service";
import { useMutation } from "@tanstack/react-query";

type ResendVerifyEmailPayload = Parameters<typeof authService.resendVerifyEmail>[0];

export function useResendVerifyEmailMutation() {
  return useMutation({
    mutationFn: (payload: ResendVerifyEmailPayload) =>
      authService.resendVerifyEmail(payload),
    retry: 0,
  });
}
