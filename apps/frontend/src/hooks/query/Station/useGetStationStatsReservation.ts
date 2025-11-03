import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";
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
  return useQuery({
    queryKey: ["reservation", "stats", "station", stationId],
    queryFn: () => getStatsReservationStation(stationId),
    enabled: !!stationId,
  });
}