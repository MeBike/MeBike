import { authService } from "@/services/auth.service";
import type { RegisterSchemaFormData } from "@/schemas/auth-schema";
import { useMutation } from "@tanstack/react-query";

export const useRegisterMutation = () => {
    return useMutation({
        mutationFn: (data:RegisterSchemaFormData) => authService.register(data),
    })
}