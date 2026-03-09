import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";

export const useResendVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: () => authService.resendVerifyEmail(),
    })
}