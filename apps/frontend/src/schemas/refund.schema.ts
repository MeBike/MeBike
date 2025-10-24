import * as z from "zod";
import type { RefundStatus } from "@/types";
export const updateRefundSchema = z.object({
    newStatus: z.enum([] as RefundStatus[]),
    
});
export type UpdateRefundSchemaFormData = z.infer<typeof updateRefundSchema>;