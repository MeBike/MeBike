import { useMutation } from "@tanstack/react-query";
import type { LoginSchemaFormData } from "@/schemas/authSchema";
import { authService } from "@services/authService";
export const useLoginMutation = () => {
    return useMutation({
        mutationFn: (data:LoginSchemaFormData) => authService.login(data),
    })
}