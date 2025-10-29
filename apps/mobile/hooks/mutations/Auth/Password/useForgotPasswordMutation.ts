import { useMutation } from "@tanstack/react-query";

import type { ForgotPasswordSchemaFormData } from "@schemas/authSchema";

import { authService } from "@services/auth.service";

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (data: ForgotPasswordSchemaFormData) => authService.forgotPassword(data),
  });
}
