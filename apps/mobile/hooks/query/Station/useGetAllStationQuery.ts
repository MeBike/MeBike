import { useQuery } from "@tanstack/react-query";

import { fetchStations } from "@/screen/station-select/api/stations.api";

async function fetchAllStations() {
  try {
    const response = await fetchStations();
    return response.stations;
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
