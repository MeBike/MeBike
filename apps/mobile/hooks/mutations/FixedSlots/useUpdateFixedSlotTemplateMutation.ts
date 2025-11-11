import { useMutation } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slot.service";

import type { UpdateFixedSlotTemplatePayload } from "@/types/fixed-slot-types";

type UpdateParams = {
  id: string;
  data: UpdateFixedSlotTemplatePayload;
};

export function useUpdateFixedSlotTemplateMutation() {
  return useMutation({
    mutationFn: ({ id, data }: UpdateParams) =>
      fixedSlotService.update(id, data),
  });
}
