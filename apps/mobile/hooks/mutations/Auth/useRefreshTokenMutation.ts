import { authService } from "@services/authService";
import { useMutation } from "@tanstack/react-query";
export const useRefreshTokenMutation = () => {
    return useMutation({
        mutationFn: (refresh_token: string) => authService.refreshToken(refresh_token),
    });
}