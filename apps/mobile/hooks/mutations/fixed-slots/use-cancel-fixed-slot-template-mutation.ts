import type { FixedSlotError } from "@services/fixed-slots";

import { useMutation } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slots";

import type { FixedSlotTemplate } from "@/contracts/server";

export function useCancelFixedSlotTemplateMutation() {
  return useMutation<FixedSlotTemplate, FixedSlotError, string>({
    mutationFn: (id: string) => fixedSlotService.cancel(id).then((result) => {
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    }),
  });
}
