import { useMutation } from "@tanstack/react-query";

import { authService } from "@services/auth.service";

export function useRefreshTokenMutation() {
  return useMutation({
    mutationFn: (refresh_token: string) => authService.refreshToken(refresh_token),
  });
}
