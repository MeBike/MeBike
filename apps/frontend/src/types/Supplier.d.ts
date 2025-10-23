export interface Supplier {
  _id: string;
  name: string;
  contact_info: {
    address: string;
    phone_number: string;
  };
  contract_fee: string;
  status: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG";
  created_at: string;
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