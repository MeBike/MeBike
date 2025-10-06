import { authService } from "@/services/authService";
import type { RegisterFormData } from "@/schemas/authSchema";
import { useMutation } from "@tanstack/react-query";

export const useRegisterMutation = () => {
    return useMutation({
        mutationFn: (data:RegisterFormData) => authService.register(data),
    })
}