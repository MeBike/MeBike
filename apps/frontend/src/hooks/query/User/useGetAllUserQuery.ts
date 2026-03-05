import { useQuery } from "@tanstack/react-query";
import { userService } from "@services/user.service";
import { VerifyStatus } from "@/types";
import { QUERY_KEYS } from "@constants/queryKey";
const fetchAllUserRequests = async ({
  page,
  pageSize,
  verify,
  role,
  fullName,
}: {
  page?: number;
  pageSize?: number;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
  fullName?: string;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if (verify) query.verify = verify;
    if (role) query.role = role;
    if (fullName) query.fullName = fullName;
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
  pageSize,
  verify,
  role,
  fullName,
}: {
  page?: number;
  pageSize?: number;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
  fullName?: string;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.ALL(page, pageSize, verify, role, fullName),
    queryFn: () => fetchAllUserRequests({ page, pageSize, verify, role, fullName }),
  });
};