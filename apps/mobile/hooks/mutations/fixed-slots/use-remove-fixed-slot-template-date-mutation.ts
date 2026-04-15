import type { FixedSlotError } from "@services/fixed-slots";

import { fixedSlotService } from "@services/fixed-slots";
import { useMutation } from "@tanstack/react-query";

import type { FixedSlotTemplate } from "@/contracts/server";

type RemoveDateParams = {
  id: string;
  slotDate: string;
};

export function useRemoveFixedSlotTemplateDateMutation() {
  return useMutation<FixedSlotTemplate, FixedSlotError, RemoveDateParams>({
    mutationFn: ({ id, slotDate }: RemoveDateParams) =>
      fixedSlotService.removeDate(id, slotDate).then((result) => {
        if (!result.ok) {
          throw result.error;
        }

        return result.value;
      }),
  });
}
