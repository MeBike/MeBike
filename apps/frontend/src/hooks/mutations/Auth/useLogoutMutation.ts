import { authService } from "@/services/authService";
import { useMutation } from "@tanstack/react-query";
export const useLogoutMutation = () => {
    return useMutation({
        mutationFn: (refresh_token:string) => authService.logout(refresh_token),
    })
}