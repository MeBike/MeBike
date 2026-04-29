import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { HTTP_STATUS } from "@/constants";
import { UserRole } from "@/types";
const fetchStaffOnly = async ({
  page,
  pageSize,
  role,
  verify,
  fullName,
}: {
  page?: number;
  pageSize?: number;
  role?: UserRole | "";
  verify?: "VERIFIED" | "UNVERIFIED" | "BANNED" | "";
  fullName ?: string;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if (role) query.role = role;
    if(verify) query.verify = verify;
    if(fullName) query.fullName = fullName;
    const response = await userService.getStaffOnly(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch staff members");
  }
};
export const useGetStaffOnlyQuery = ({
  page,
  pageSize,
  role,
  verify,
  fullName,
}: {
  page?: number;
  pageSize?: number;
  role ?: UserRole | "";
  verify?: "VERIFIED" | "UNVERIFIED" | "BANNED" | "",
  fullName ?: string;
}) => {
  return useQuery({
    queryKey: ["staff-only",{page,pageSize,role,verify,fullName}],
    queryFn: () => fetchStaffOnly({ page: page, pageSize: pageSize, role:role,verify,fullName}),
    staleTime: 5 * 60 * 1000,
  });
};
