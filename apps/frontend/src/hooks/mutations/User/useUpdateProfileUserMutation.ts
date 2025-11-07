import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UserProfile } from "@/schemas/userSchema";
export const useUpdateProfileUserMutation = (id: string) => {
  return useMutation({
    mutationFn: (data: UserProfile) => userService.updateProfileAdmin(id, data),
  });
};
