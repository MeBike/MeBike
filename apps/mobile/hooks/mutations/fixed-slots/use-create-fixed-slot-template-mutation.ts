import type { FixedSlotError } from "@services/fixed-slots";

import { fixedSlotService } from "@services/fixed-slots";
import { useMutation } from "@tanstack/react-query";

import type { CreateFixedSlotTemplatePayload, FixedSlotTemplate } from "@/contracts/server";

export function useCreateFixedSlotTemplateMutation() {
  return useMutation<FixedSlotTemplate, FixedSlotError, CreateFixedSlotTemplatePayload>({
    mutationFn: (payload: CreateFixedSlotTemplatePayload) =>
      fixedSlotService.create(payload).then((result) => {
        if (!result.ok) {
          throw result.error;
        }
        return result.value;
      }),
  });
}
