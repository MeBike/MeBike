import { useMutation } from "@tanstack/react-query";

import type { UpdateProfileSchemaFormData } from "@schemas/authSchema";

import { authService } from "@services/authService";

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (data: Partial<UpdateProfileSchemaFormData>) => authService.updateProfile(data),
  });
}
