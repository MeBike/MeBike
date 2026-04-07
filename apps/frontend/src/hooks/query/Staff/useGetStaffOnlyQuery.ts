import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { HTTP_STATUS } from "@/constants";
const fetchStaffOnly = async ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await userService.getStaffOnly({ page, pageSize });
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
}: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["staff-only",{page,pageSize}],
    queryFn: () => fetchStaffOnly({ page: page, pageSize: pageSize}),
    staleTime: 5 * 60 * 1000,
  });
};
