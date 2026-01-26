import { useQuery } from "@tanstack/react-query";

import { fetchBikeDetail } from "@/screen/bike-detail/api/bike-detail.api";
import { log } from "@/lib/logger";

async function fetchDetailBikeByID(id?: string) {
  if (!id) {
    return null;
  }
  try {
    const response = await fetchBikeDetail(id);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    const maybeAxios = error as {
      message?: string;
      response?: {
        status?: number;
        data?: unknown;
      };
    };
    log.error("[BikeDetail] Fetch failed", {
      message: maybeAxios?.message ?? "Unknown error",
      status: maybeAxios?.response?.status,
      data: maybeAxios?.response?.data,
    });
  }
  return null;
}

export function useBikeDetailQuery(id?: string) {
  return useQuery({
    queryKey: ["bikes", "detail", id ?? ""],
    queryFn: () => fetchDetailBikeByID(id),
    enabled: Boolean(id),
  });
}
