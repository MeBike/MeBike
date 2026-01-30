import { useMutation } from "@tanstack/react-query";

import { authService } from "@services/auth.service";

export function useLogoutMutation() {
  return useMutation({
    mutationFn: (refresh_token: string) => authService.logout(refresh_token),
  });
}
