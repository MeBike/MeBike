import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
const getReservationForecastDetail = async () => {
  try {
    const response = await distributionRequestService.getReservationForecase();
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetReservationForecastQuery = () => {
  return useQuery({
    queryKey: ["data", "reservation-forecast"],
    queryFn: () => getReservationForecastDetail(),
    enabled: true,
  });
};
