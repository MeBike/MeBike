import { useMutation } from "@tanstack/react-query";

import { bikeService } from "@services/bikeService";

export function useReportBike() {
  return useMutation({
    mutationKey: ["bikes", "report"],
    mutationFn: (id: string) => bikeService.reportBrokenBike(id),
  });
}
