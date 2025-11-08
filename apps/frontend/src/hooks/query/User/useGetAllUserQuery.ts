import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { VerifyStatus } from "@/types";
const fetchAllUserRequests = async ({
  page,
  limit,
  verify,
  role,
}: {
  page?: number;
  limit?: number;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      limit: limit ?? 10,
    };
    if (verify) query.verify = verify;
    if (role) query.role = role;

    const response = await userService.getAllUsers(query);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const useGetAllUserQuery = ({
  page,
  limit,
  verify,
  role,
}: {
  page?: number;
  limit?: number;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
}) => {
  return useQuery({
    queryKey: ["all", "user", page, limit, verify , role],
    queryFn: () => fetchAllUserRequests({ page, limit, verify, role }),
  });
};