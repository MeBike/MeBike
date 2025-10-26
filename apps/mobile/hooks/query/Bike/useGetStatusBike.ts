import { useQuery } from "@tanstack/react-query";

import { bikeService } from "@services/bikeService";

export function useGetStatusBikeQuery() {
  return useQuery({
    queryKey: ["bikes", "status"],
    queryFn: () => bikeService.getStatusBikeAdmin(),
  });
}
