import type { BikeError } from "@services/bike-error";

import { bikeService } from "@services/bike.service";
import { useQuery } from "@tanstack/react-query";

async function fetchDetailBikeByID(id: string) {
  const result = await bikeService.getBikeByIdForAll(id);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}
export function useGetBikeByIDAllQuery(id: string) {
  return useQuery<Awaited<ReturnType<typeof fetchDetailBikeByID>>, BikeError>({
    queryKey: ["bikes", "detail", id],
    queryFn: () => fetchDetailBikeByID(id),
    enabled: Boolean(id),
  });
}
