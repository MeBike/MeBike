import { useMutation } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slot.service";

export function usePauseFixedSlotTemplateMutation() {
  return useMutation({
    mutationFn: (id: string) => fixedSlotService.pause(id),
  });
}
