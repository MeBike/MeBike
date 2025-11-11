import { useQuery } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slot.service";

export function useFixedSlotTemplateDetailQuery(
  id?: string,
  enabled: boolean = false,
) {
  return useQuery({
    queryKey: ["fixed-slots", "detail", id],
    enabled: Boolean(id) && enabled,
    queryFn: async () => {
      const response = await fixedSlotService.getDetail(id!);
      return response.data.result;
    },
  });
}
