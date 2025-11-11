import { useMutation } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slot.service";

export function useCancelFixedSlotTemplateMutation() {
  return useMutation({
    mutationFn: (id: string) => fixedSlotService.cancel(id),
  });
}
