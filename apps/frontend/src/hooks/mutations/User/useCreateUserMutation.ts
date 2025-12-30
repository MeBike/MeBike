import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { CreateUserFormData } from "@/schemas/userSchema";
export const useCreateUserMutation = () => {
    return useMutation({
      mutationFn: (data: CreateUserFormData) => userService.createUser(data),
    });
}