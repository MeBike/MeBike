import { useQuery } from "@tanstack/react-query";

import { stationService } from "@services/station.service";

async function fetchNearMeStations(latitude: number, longitude: number) {
  try {
    const response = await stationService.getNearMe(latitude, longitude);
    if (response.status === 200) {
      return response.data.data;
    }
  }
  catch (error) {
    throw new Error("Failed to fetch nearby stations");
  }
}

export function useGetNearMeStations(latitude: number, longitude: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["near-me-stations", latitude, longitude],
    queryFn: () => fetchNearMeStations(latitude, longitude),
    enabled: enabled && latitude !== null && longitude !== null,
  });
}
