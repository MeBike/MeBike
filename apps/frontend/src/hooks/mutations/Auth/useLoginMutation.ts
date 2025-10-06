import { useMutation } from "@tanstack/react-query";
import type { LoginFormData } from "@/schemas/authSchema";
import { authService } from "@services/authService";
export const useLoginMutation = () => {
    return useMutation({
        mutationFn: (data:LoginFormData) => authService.login(data),
    })
}