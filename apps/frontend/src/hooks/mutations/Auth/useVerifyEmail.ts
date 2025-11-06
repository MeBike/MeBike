import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";

export const useVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: ({ email, otp }: { email: string; otp: string }) => authService.verifyEmail({email, otp}),
    })
}
