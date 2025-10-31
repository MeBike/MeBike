import { useMutation } from "@tanstack/react-query";

import { authService } from "@services/auth.service";

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (email_verify_token: string) => authService.verifyEmail(email_verify_token),
  });
}
