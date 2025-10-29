import { useQuery } from "@tanstack/react-query";

import { stationService } from "@services/station.service";

async function fetchAllStations() {
  try {
    const response = await stationService.getAllStations();
    if (response.status === 200) {
      return response.data.data;
    }
  }
  catch (error) {
    throw new Error("Failed to fetch stations");
  }
}
export function useGetAllStation() {
  return useQuery({
    queryKey: ["all-stations"],
    queryFn: () => fetchAllStations(),
  });
}
