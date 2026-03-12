import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { ResetPasswordSchemaFormData } from "@schemas";
export const useResetPasswordUserMutation = () => {
    return useMutation({
      mutationFn: ({id , data}: { id : string , data: ResetPasswordSchemaFormData }) =>
        userService.postResetPassword(id, data),
    });
}