import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
export const useVerifyOTPMutation = () => {
  return useMutation({
    mutationFn: ({email, otp} : {email : string , otp : string}) =>
      authService.verifyForgotPassword(email , otp),
  });
};
