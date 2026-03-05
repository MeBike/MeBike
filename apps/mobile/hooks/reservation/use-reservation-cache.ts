import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useReservationCache() {
  const queryClient = useQueryClient();

  const invalidateReservationQueries = useCallback((includeSubscriptions = false) => {
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
    queryClient.invalidateQueries({ queryKey: ["reservations", "history"] });
    queryClient.invalidateQueries({ queryKey: ["rentals", "all", 1, 10] });
    queryClient.invalidateQueries({ queryKey: ["rentals"] });
    queryClient.invalidateQueries({ queryKey: ["rentals", "me"] });
    queryClient.invalidateQueries({ queryKey: ["rentals", "me", "history"] });
    queryClient.invalidateQueries({ queryKey: ["rentals", "me", "counts"] });
    queryClient.invalidateQueries({ queryKey: ["all-stations"] });
    queryClient.invalidateQueries({ queryKey: ["station"] });

    if (includeSubscriptions) {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    }
  }, [queryClient]);

  return {
    invalidateReservationQueries,
  };
}
