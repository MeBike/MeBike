import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@services/rental.service";
import { GetAllRentalsForStaffAdminProps } from "@services/rental.service";



const getAllRentalsForStaffAdmin = async ({
  page,
  limit,
  start_station,
  end_station,
  status,
}: GetAllRentalsForStaffAdminProps) => {
  try {
    const response = await rentalService.getAllRentalsForStaffAdmin({
      page,
      limit,
      start_station,
      end_station,
      status,
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching rentals for staff admin:", error);
    throw error;
  }
};
export function useGetAllRentalsAdminStaffQuery({
  page,
  limit,
  start_station,
  end_station,
  status,
}: GetAllRentalsForStaffAdminProps) {
  return useQuery({
    queryKey: ["rentals", "all-admin-staff", page, limit, start_station, end_station, status],
    queryFn: () =>
      getAllRentalsForStaffAdmin({
        page,
        limit,
        start_station,
        end_station,
        status,
      }),
  }); 
}