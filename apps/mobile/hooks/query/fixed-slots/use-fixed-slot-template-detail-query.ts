import type { FixedSlotError } from "@services/fixed-slots";

import { fixedSlotService } from "@services/fixed-slots";
import { useQuery } from "@tanstack/react-query";

import type { FixedSlotTemplate } from "@/contracts/server";

import { fixedSlotQueryKeys } from "./fixed-slot-query-keys";

export function useFixedSlotTemplateDetailQuery(
  id?: string,
  enabled: boolean = false,
  scope?: string | null,
) {
  return useQuery<FixedSlotTemplate, FixedSlotError>({
    queryKey: fixedSlotQueryKeys.detail(scope, id),
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
