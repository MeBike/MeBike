import type { FixedSlotError } from "@services/fixed-slots";

import { fixedSlotService } from "@services/fixed-slots";
import { useMutation } from "@tanstack/react-query";

import type { FixedSlotTemplate, UpdateFixedSlotTemplatePayload } from "@/contracts/server";

type UpdateParams = {
  id: string;
  data: UpdateFixedSlotTemplatePayload;
};

export function useUpdateFixedSlotTemplateMutation() {
  return useMutation<FixedSlotTemplate, FixedSlotError, UpdateParams>({
    mutationFn: ({ id, data }: UpdateParams) =>
      fixedSlotService.update(id, data).then((result) => {
        if (!result.ok) {
          throw result.error;
        }
        return result.value;
      }),
  });
}
