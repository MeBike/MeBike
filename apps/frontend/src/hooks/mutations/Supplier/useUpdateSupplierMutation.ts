import { useMutation } from "@tanstack/react-query";
import { supplierService } from "@/services/supplier.service";
import { CreateSupplierSchema } from "@/schemas/supplier.schema";
export const useUpdateSupplierMutation = () => {
    return useMutation({
      mutationKey: ["suppliers", "update"],
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: Partial<CreateSupplierSchema>;
      }) => supplierService.updateSupplier({ id, data }),
    });
}