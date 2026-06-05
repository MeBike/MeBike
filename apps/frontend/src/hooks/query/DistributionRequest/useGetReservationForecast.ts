import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
const getReservationForecastDetail = async ({startHour ,endHour} : {startHour : number , endHour : number}) => {
  try {
    const response = await distributionRequestService.getReservationForecast({startHour ,endHour});
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetReservationForecastQuery = ({startHour ,endHour} : {startHour : number , endHour : number}) => {
  return useQuery({
    queryKey: ["data", "reservation-forecast"],
    queryFn: () => getReservationForecastDetail({startHour ,endHour}),
    enabled: true,
  });
};
