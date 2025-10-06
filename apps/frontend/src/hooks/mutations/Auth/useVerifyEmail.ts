import { authService } from "@/services/authService";
import { useMutation } from "@tanstack/react-query";

export const useVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: (email_refresh_token:string) => authService.verifyEmail(email_refresh_token),
    })
}
