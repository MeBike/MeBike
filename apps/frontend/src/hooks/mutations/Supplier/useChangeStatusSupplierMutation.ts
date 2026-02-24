import { useMutation } from "@tanstack/react-query";
import { supplierService } from "@services/supplier.service";

export const useChangeStatusSupplierMutation = () => {  
    return useMutation({
      mutationFn: ({
        id,
        newStatus,
      }: {
        id: string;
        newStatus: "ACTIVE" | "INACTIVE" | "TERMINATED";
      }) => supplierService.changeStatusSupplier(id, newStatus),
    });
}