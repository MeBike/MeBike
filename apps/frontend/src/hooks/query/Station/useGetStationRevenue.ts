import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
const getStationRevenue = async ({
  from,
  to,
}: {
  from?: string;
  to?: string;
}) => {
  try {
    const response = await stationService.getStationRevenue({
      from: from,
      to: to,
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch station bike revenue");
  }
};
export const useGetStationRevenue = ({from,to} : {from ?: string , to ?:string}) => {
  return useQuery({
    queryKey: ["station-revenue", from , to ],
    queryFn: () => getStationRevenue({from : from , to : to}),
    enabled: false,
  });
};
