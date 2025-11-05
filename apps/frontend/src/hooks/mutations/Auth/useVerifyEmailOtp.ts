import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";

export const useVerifyEmailOtpMutation = () => {
    return useMutation({
        mutationFn: ({ email, otp }: { email: string; otp: string }) => authService.verifyEmailOtp(email, otp),
    })
}