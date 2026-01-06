import { useSuspenseQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const getStatsReservationStation = async (stationId: string) => {
  try {
    const response = await reservationService.getStationReservationStats(stationId);
    return response.data;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch bikes");
  }
}
export const useGetStationStatsReservationQuery = (stationId: string) => {
  return useSuspenseQuery({
    queryKey: QUERY_KEYS.STATION.RESERVATION_STATS_STATION(stationId),
    queryFn: () => getStatsReservationStation(stationId),
  });
}