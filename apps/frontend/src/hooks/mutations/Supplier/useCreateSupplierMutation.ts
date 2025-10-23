import { useMutation } from "@tanstack/react-query";
import { supplierService } from "@/services/supplier.service";
import type { CreateSupplierSchema } from "@/schemas/supplier.schema";
export const useCreateSupplierMutation = () => {
  return useMutation({
    mutationKey: ["create-supplier"],
    mutationFn: async (supplierData: CreateSupplierSchema) => {
      const response = await supplierService.createSupplier(supplierData);
      return response;
    },
    });
};