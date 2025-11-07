import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { ResetPasswordRequest} from "@/schemas/userSchema";
export const useResetPasswordUserMutation = () => {
    return useMutation({
      mutationFn: ({id , data }: { id : string , data: ResetPasswordRequest }) =>
        userService.postResetPassword(id, data),
    });
}