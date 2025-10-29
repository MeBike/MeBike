import { useMutation } from "@tanstack/react-query";

import type { ResetPasswordSchemaFormData } from "@/schemas/authSchema";

import { authService } from "@services/auth.service";

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (data: ResetPasswordSchemaFormData) => authService.resetPassword(data),
  });
}
