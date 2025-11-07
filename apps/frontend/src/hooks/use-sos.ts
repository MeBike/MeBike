import { useGetSOSDetailQuery } from "./query/SOS/useGetSOSDetailQuery";
import { useGetSOSQuery } from "./query/SOS/useGetSOSQuery";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UseSOSProps {
  hasToken: boolean;
  page?: number;
  limit?: number;
  id?: string;
}

export function useSOS({ hasToken, page, limit, id }: UseSOSProps) {
  const queryClient = useQueryClient();

  const {
    data: sosRequests,
    isLoading,
    refetch: refetchSOS,
  } = useGetSOSQuery({ page, limit });

  const {
    data: sosDetail,
    refetch: refetchSOSDetailRequest,
    isLoading: isLoadingSOSDetail,
  } = useGetSOSDetailQuery(id || "");

  const refetchSOSRequest = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    await refetchSOS();
  }, [hasToken, refetchSOS]);

  const refetchSOSDetail = useCallback(async () => {
    if (!hasToken || !id) {
      return;
    }
    await refetchSOSDetailRequest();
  }, [hasToken, id, refetchSOSDetailRequest]);

  return {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    isLoadingSOSDetail,
    refetchSOSDetail,
  };
}
