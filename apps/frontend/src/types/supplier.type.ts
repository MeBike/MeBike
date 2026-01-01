import type { GraphQLMutationResponse } from "@/types/GraphQL";
import { Bike } from "./Bike";
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
  bikes: Bike[];
}
export interface StatSupplier {
  totalSupplier : number;
  totalSupplierActive : number;
  totalSupplierInactive : number;
  totalBike : number;
  totalAvailableBike : number;
  totalBookedBike : number;
  totalBrokenBike : number;
  totalReservedBike : number;
  totalMaintainedBike : number;
  totalUnAvailableBike : number;
}
export type GetSupplierResponse = GraphQLMutationResponse<"Suppliers", Supplier[]>;
export type GetDetailSupplierResponse = GraphQLMutationResponse<"Supplier",Supplier>;
export type CreateSupplierResponse = GraphQLMutationResponse<"CreateSupplier">
export type GetStatsSupplierResponse = GraphQLMutationResponse<"GetSupplierStats",StatSupplier>;
export type UpdateSupplierResponse = GraphQLMutationResponse<"UpdateSupplier">;