import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UserProfile } from "@/schemas/user-schema";
export const useUpdateProfileUserMutation = () => {
  return useMutation({
    mutationFn: ({id , data }: {id: string; data: UserProfile}) => userService.updateProfileAdmin(id, data),
  });
};
