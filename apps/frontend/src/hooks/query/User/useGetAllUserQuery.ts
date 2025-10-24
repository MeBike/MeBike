import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { DetailUser } from "@/services/auth.service";
import { VerifyStatus } from "@/types";
import { refundService } from "@/services/refund.service";
const fetchAllUserRequests = async ({
  page,
  limit,
  verify,
  role,
}: {
  page?: number;
  limit?: number;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "";
}) => {
  try {
    const query: any = {
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
  role?: "ADMIN" | "USER" | "STAFF" | "";
}) => {
  return useQuery({
    queryKey: ["all","user" ,  page, limit, verify, role],
    queryFn: () => fetchAllUserRequests({ page, limit, verify, role }),
  });
};