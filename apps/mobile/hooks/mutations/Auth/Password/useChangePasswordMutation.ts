import { useMutation } from "@tanstack/react-query";

import type { ChangePasswordSchemaFormData } from "@schemas/authSchema";

import { authService } from "@services/authService";

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (data: ChangePasswordSchemaFormData) => authService.changePassword(data),
  });
}
