import { useMutation } from "@tanstack/react-query";
import type { LoginSchemaFormData } from "@/schemas/auth-schema";
import { authService } from "@/services/auth.service";
export const useLoginMutation = () => {
    return useMutation({
        mutationFn: (data:LoginSchemaFormData) => authService.login(data),
    })
}