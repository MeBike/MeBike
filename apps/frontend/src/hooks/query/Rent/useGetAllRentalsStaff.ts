import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@services/rental.service";
import { QUERY_KEYS } from "@constants";
import { RentalStatus } from "@/types";

const getAllRentalsForStaffAdmin = async ({
  page,
  pageSize,
  startStation,
  endStation,
  status,
}: {
  page ?: number,
  pageSize ?: number,
  startStation ?: string,
  endStation ?: string,
  status ?: RentalStatus,
}) => {
  try {
    const response = await rentalService.getAllRentalsForStaff({
      page : page,
      pageSize : pageSize,
      startStation : startStation,
      endStation : endStation,
      status : status,
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching rentals for staff admin:", error);
    throw error;
  }
};
export function useGetAllRentalsStaffQuery({
  page,
  pageSize,
  startStation,
  endStation,
  status,
}: {
  page ?: number,
  pageSize ?: number,
  startStation ?: string,
  endStation ?: string,
  status ?: RentalStatus,
}) {
  return useQuery({
    queryKey: QUERY_KEYS.RENTAL.ALL_ADMIN_STAFF(
      page,
      pageSize,
      startStation,
      endStation,
      status
    ),
    queryFn: () =>
      getAllRentalsForStaffAdmin({
        page,
        pageSize,
        startStation,
        endStation,
        status,
      }),
    enabled:false,  
  });
}
