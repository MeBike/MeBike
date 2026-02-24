export interface Supplier {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  contractFee: number;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED";
  updatedAt: string;
}
export interface StatsSupplierBike {
  supplierId: string;
  supplierName: string;
  totalBikes: number;
  available: number;
  booked: number;
  broken: number;
  reserved: number;
  maintained: number;
  unavailable : number;
}