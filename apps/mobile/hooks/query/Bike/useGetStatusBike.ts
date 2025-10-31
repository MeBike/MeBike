import { useQuery } from "@tanstack/react-query";

import { bikeService } from "@services/bike.service";

export function useGetStatusBikeQuery() {
  return useQuery({
    queryKey: ["bikes", "status"],
    queryFn: () => bikeService.getStatusBikeAdmin(),
  });
}
