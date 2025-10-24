import { useMutation } from "@tanstack/react-query";
import { refundService } from "@services/refund.service";
import { UpdateRefundSchemaFormData } from "@/schemas/refund.schema";
import axios from "axios";
import { toast } from "sonner";
export const useUpdateRefundRequestMutation = (id: string) => {
    return useMutation({
        mutationKey: ["updateRefundRequest", id],
        mutationFn: async (data: UpdateRefundSchemaFormData) => refundService.updateRefundRequestById(id, data),
    });
}