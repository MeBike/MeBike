import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@services/rental.service";
import { HTTP_STATUS, QUERY_KEYS } from "@constants";
import { RentalStatus } from "@/types";

const getAllRentalsForStaff = async ({
  page,
  pageSize,
  startStation,
  endStation,
  status,
  userId,
  bikeId,
}: {
  page ?: number,
  pageSize ?: number,
  startStation ?: string,
  endStation ?: string,
  status ?: RentalStatus,
  userId?:string,
  bikeId?:string,
}) => {
  try {
    const query : Record<string,number | string> = {
      page : page ?? 1,
      pageSize : pageSize ?? 5,
    }
    if (startStation) query.startStation = startStation;
    if (endStation) query.endStation = endStation;
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (bikeId) query.bikeId = bikeId;
    const response = await rentalService.getAllRentalsForStaff(query);
    if (response.status === HTTP_STATUS.OK) {
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
  userId,
  bikeId,
}: {
  page ?: number,
  pageSize ?: number,
  startStation ?: string,
  endStation ?: string,
  status ?: RentalStatus,
  userId?:string,
  bikeId?:string,
}) {
  return useQuery({
    queryKey: QUERY_KEYS.RENTAL.ALL_ADMIN_STAFF(
      page,
      pageSize,
      startStation,
      endStation,
      status,
      userId,
      bikeId
    ),
    queryFn: () =>
      getAllRentalsForStaff({
        page : page,
        pageSize : pageSize,
        startStation : startStation,
        endStation : endStation,
        status : status,
        userId : userId,
        bikeId : bikeId,
      }),
    enabled : false,  
  });
}
