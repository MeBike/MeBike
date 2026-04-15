import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { HTTP_STATUS } from "@/constants";
import { UserRole } from "@/types";
const fetchStaffOnly = async ({
  page,
  pageSize,
  role,
}: {
  page?: number;
  pageSize?: number;
  role ?: UserRole;
}) => {
  try {
     const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if (role) query.role = role;
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
}: {
  page?: number;
  pageSize?: number;
  role ?: UserRole;
}) => {
  return useQuery({
    queryKey: ["staff-only",{page,pageSize,role}],
    queryFn: () => fetchStaffOnly({ page: page, pageSize: pageSize}),
    staleTime: 5 * 60 * 1000,
  });
};
