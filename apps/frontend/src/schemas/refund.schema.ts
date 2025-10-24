import * as z from "zod";

export const updateRefundSchema = z.object({
    status: z.enum(["ĐÃ DUYỆT", "TỪ CHỐI", "ĐÃ HOÀN TIỀN"]),
    
});
export type UpdateRefundSchemaFormData = z.infer<typeof updateRefundSchema>;