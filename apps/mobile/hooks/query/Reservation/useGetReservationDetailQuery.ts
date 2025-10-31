import { useQuery } from "@tanstack/react-query";

import { reservationService } from "@services/reservation.service";

export function useGetReservationDetailQuery(id: string, enabled = false) {
  return useQuery({
    queryKey: ["reservations", "detail", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const response = await reservationService.getReservationDetails(id);
      const payload = response.data as any;
      return payload?.data ?? payload?.result ?? payload;
    },
  });
}
