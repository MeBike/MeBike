import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";

export const useVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: (email_verify_token:string) => authService.verifyEmail(email_verify_token),
    })
}
