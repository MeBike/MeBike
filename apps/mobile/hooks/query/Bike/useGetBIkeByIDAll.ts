import { useQuery } from "@tanstack/react-query";

import { bikeService } from "@services/bikeService";

export function useGetBikeByIDAllQuery(id: string) {
  return useQuery({
    queryKey: ["bikes", "detail", id],
    queryFn: () => bikeService.getBikeByIdForAll(id),
  });
}
