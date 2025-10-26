import { useMutation } from "@tanstack/react-query";

import { authService } from "@services/authService";

export function useResendVerifyEmailMutation() {
  return useMutation({
    mutationFn: () => authService.resendVerifyEmail(),
  });
}
