import { useMutation } from "@tanstack/react-query";

import { bikeService } from "@services/bikeService";

export function useSoftDeleteBikeMutation() {
  return useMutation({
    mutationFn: (id: string) => bikeService.deleteBike(id),
  });
}
