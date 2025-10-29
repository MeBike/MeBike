import { useMutation } from "@tanstack/react-query";

import type { RegisterSchemaFormData } from "@schemas/authSchema";

import { authService } from "@services/auth.service";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (data: RegisterSchemaFormData) => authService.register(data),
  });
}
