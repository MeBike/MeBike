import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UpdateUserFormData } from "@/schemas/user-schema";
export const useUpdateProfileUserMutation = () => {
  return useMutation({
    mutationFn: ({id , data }: {id: string; data: UpdateUserFormData}) => userService.updateProfileAdmin(id, data),
  });
};
