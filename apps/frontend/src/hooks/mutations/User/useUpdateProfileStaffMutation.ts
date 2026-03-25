import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UpdateStaffFormData } from "@/schemas/user-schema";
export const useUpdateProfileStaffMutation = () => {
  return useMutation({
    mutationFn: ({id , data }: {id: string; data: UpdateStaffFormData}) => userService.updateProfileAdmin(id, data),
  });
};
