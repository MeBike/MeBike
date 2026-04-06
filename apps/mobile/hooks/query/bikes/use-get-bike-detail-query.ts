import type { BikeError } from "@services/bike-error";

import { bikeService } from "@services/bike.service";
import { useQuery } from "@tanstack/react-query";

async function fetchBikeDetail(id: string) {
  const result = await bikeService.getBikeByIdForAll(id);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

export function useGetBikeDetailQuery(id: string) {
  return useQuery<Awaited<ReturnType<typeof fetchBikeDetail>>, BikeError>({
    enabled: Boolean(id),
    queryFn: () => fetchBikeDetail(id),
    queryKey: ["bikes", "detail", id],
  });
}
