import type { GraphQLMutationResponse } from "@/types/GraphQL";
export interface Supplier {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  updatedAt: string;
  createdAt: string;
  contactFee: number;
  contactInfo: {
    address: string;
    phone: string
  };
}
export type GetSupplierResponse = GraphQLMutationResponse<"Suppliers", Supplier[]>;
export type GetDetailSupplierResponse = GraphQLMutationResponse<"Supplier",Supplier>;
export type CreateSupplierResponse = GraphQLMutationResponse<"CreateSupplier">