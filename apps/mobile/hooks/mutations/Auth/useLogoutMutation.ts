import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
export const useLogoutMutation = () => {
    return useMutation({
        mutationFn: () => authService.logout(),
    })
}