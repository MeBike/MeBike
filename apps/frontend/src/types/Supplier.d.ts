export interface Supplier {
  id: string;
  name: string;
  contactInfo: {
    address: string;
    phone: string;
  };
  contract_fee: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}
export interface StatsSupplierBike {
  supplier_id: string;
  supplier_name: string;
  total_bikes: number;
  active_bikes: number;
  booked_bikes: number;
  broken_bikes: number;
  broken_bikes: number;
  maintain_bikes: number;
  unavailable_bikes : number;
}