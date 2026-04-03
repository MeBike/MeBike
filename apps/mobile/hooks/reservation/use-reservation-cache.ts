import {
  invalidateAllRentalQueries,
  invalidateRentalSupportQueries,
} from "@hooks/rentals/rental-cache";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useReservationCache() {
  const queryClient = useQueryClient();

  const invalidateReservationQueries = useCallback((includeSubscriptions = false) => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
      queryClient.invalidateQueries({ queryKey: ["reservations", "history"] }),
      invalidateAllRentalQueries(queryClient),
      invalidateRentalSupportQueries(queryClient, { includeSubscriptions }),
    ]);
  }, [queryClient]);

  return {
    invalidateReservationQueries,
  };
}
