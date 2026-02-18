import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { VerifyEmailSchemaFormData } from "@/schemas/authSchema";
export const useVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: (data: VerifyEmailSchemaFormData) => authService.verifyEmail(data),
        retry: 0,
    })
}
