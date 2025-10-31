import { useMutation } from "@tanstack/react-query";

import { authService } from "@services/auth.service";

export function useResendVerifyEmailMutation() {
  return useMutation({
    mutationFn: () => authService.resendVerifyEmail(),
  });
}
