import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UpdateStaffFormData } from "@/schemas/user-schema";
export const useCreateStaffMutation = () => {
    return useMutation({
      mutationFn: (data : UpdateStaffFormData) =>
        userService.createStaff(data),
    });
}