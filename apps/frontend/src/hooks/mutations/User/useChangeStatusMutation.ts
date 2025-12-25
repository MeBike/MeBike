import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
export const useChangeStatusMutation = () => {
  return useMutation({
    mutationFn: (data: {accountId : string , status : "Active" | "Inactive"}) => userService.changeStatus(data),
  });
};
