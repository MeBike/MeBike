import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
export const useRefreshTokenMutation = () => {
    return useMutation({
        mutationFn: (refresh_token: string) => authService.refreshToken(refresh_token),
    });
}