import { useQuery } from "@tanstack/react-query";
import { userService } from "@services/user.service";
import { VerifyStatus } from "@/types";

type AccountStatusFilter = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "";

const fetchAllUserRequests = async ({
  page,
  pageSize,
  verify,
  accountStatus,
  role,
  fullName,
}: {
  page?: number;
  pageSize?: number;
  verify?: VerifyStatus;
  accountStatus?: AccountStatusFilter;
  role?: "ADMIN" | "USER" | "STAFF" | "";
  fullName?: string;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if (verify) query.verify = verify;
    if (accountStatus) query.accountStatus = accountStatus;
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
  accountStatus,
  role,
  fullName,
}: {
  page?: number;
  pageSize?: number;
  verify?: VerifyStatus;
  accountStatus?: AccountStatusFilter;
  role?: "ADMIN" | "USER" | "STAFF" | "";
  fullName?: string;
}) => {
  return useQuery({
    queryKey: ["user", "all", { page, pageSize, verify, accountStatus, role, fullName }],
    queryFn: () => fetchAllUserRequests({ page, pageSize, verify, accountStatus, role, fullName }),
  });
};
