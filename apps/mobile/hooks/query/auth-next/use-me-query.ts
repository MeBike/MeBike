import { userService } from "@services/users/user-service";
import { useQuery } from "@tanstack/react-query";

type UserDetail = import("@services/users/user-service").UserDetail;
type UserError = import("@services/users/user-error").UserError;

export function useMeQuery(enabled: boolean) {
  return useQuery<UserDetail, UserError>({
    queryKey: ["authNext", "me"],
    enabled,
    retry: false,
    queryFn: async () => {
      const result = await userService.me();
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
