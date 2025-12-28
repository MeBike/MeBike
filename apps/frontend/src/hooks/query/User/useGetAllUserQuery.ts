import { useQuery } from "@tanstack/react-query";
import { userService } from "@services/user.service";
import { VerifyStatus } from "@/types";
import { QUERY_KEYS } from "@constants/queryKey";
const fetchAllUserRequests = async ({
  page,
  limit,
  verify,
  role,
  search
}: {
  page?: number;
  limit?: number;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
  search?: string;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      limit: limit ?? 10,
    };
    if (verify) query.verify = verify;
    if (role) query.role = role;
    if (search) query.search = search;
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
  search
}: {
  page?: number;
  limit?: number;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
  search?: string;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.ALL(page, limit, verify, role, search),
    queryFn: () => fetchAllUserRequests({ page, limit, verify, role, search }),
  });
};