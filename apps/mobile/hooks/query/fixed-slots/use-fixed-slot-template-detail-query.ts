import { useQuery } from "@tanstack/react-query";

import type { FixedSlotError } from "@services/fixed-slots";

import { fixedSlotService } from "@services/fixed-slots";

import type { FixedSlotTemplate } from "@/contracts/server";

export function useFixedSlotTemplateDetailQuery(
  id?: string,
  enabled: boolean = false,
) {
  return useQuery<FixedSlotTemplate, FixedSlotError>({
    queryKey: ["fixed-slots", "detail", id],
    enabled: Boolean(id) && enabled,
    queryFn: async () => {
      const result = await fixedSlotService.getDetail(id!);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
