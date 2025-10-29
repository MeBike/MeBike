import { useMutation } from "@tanstack/react-query";

import { bikeService } from "@services/bike.service";

export function useSoftDeleteBikeMutation() {
  return useMutation({
    mutationFn: (id: string) => bikeService.deleteBike(id),
  });
}
