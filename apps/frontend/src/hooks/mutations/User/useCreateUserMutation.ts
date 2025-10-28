import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UserProfile } from "@/schemas/userSchema";
export const useCreateUserMutation = () => {
    return useMutation({
      mutationFn: (data : UserProfile) =>
        userService.createUser(data),
    });
}