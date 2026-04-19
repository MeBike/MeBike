import { z } from "zod";
const isoDateRegex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
export const CreateAdminCouponRuleSchema = z.object({
  discountType: z.literal("FIXED_AMOUNT"),
  discountValue: z.number().int().min(1, "Không được để trống"),
  minRidingMinutes: z.number().int().min(1, "Không được để trống"),
  name: z.string().min(1, "Không được để trống"),
  triggerType: z.literal("RIDING_DURATION"),
  activeFrom: z.coerce.date().nullable().optional(),
  activeTo: z.coerce.date().nullable().optional(),
  priority: z.number().int().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreateAdminCouponRuleBody = z.infer<
  typeof CreateAdminCouponRuleSchema
>;
