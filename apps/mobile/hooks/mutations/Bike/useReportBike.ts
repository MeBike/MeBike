import type { BikeError } from "@services/bike-error";
import type { BikeSummary } from "@/contracts/server";

import { useMutation } from "@tanstack/react-query";

import { bikeService } from "@services/bike.service";

export function useReportBike() {
  return useMutation<BikeSummary, BikeError, string>({
    mutationKey: ["bikes", "report"],
    mutationFn: async (id: string) => {
      const result = await bikeService.reportBrokenBike(id);
      if (!result.ok) {
        throw result.error;
      }

      return result.value;
    },
  });
}
