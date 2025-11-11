import { useMutation } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slot.service";

export function useResumeFixedSlotTemplateMutation() {
  return useMutation({
    mutationFn: (id: string) => fixedSlotService.resume(id),
  });
}
