import { useMutation } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slot.service";

import type { CreateFixedSlotTemplatePayload } from "@/types/fixed-slot-types";

export function useCreateFixedSlotTemplateMutation() {
  return useMutation({
    mutationFn: (payload: CreateFixedSlotTemplatePayload) =>
      fixedSlotService.create(payload),
  });
}
