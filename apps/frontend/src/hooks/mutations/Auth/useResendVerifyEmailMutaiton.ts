import { authService } from "@/services/authService";
import { useMutation } from "@tanstack/react-query";

export const useResendVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: () => authService.resendVerifyEmail(),
    })
}