import type { Decimal128 } from "mongodb";

export type CreateSupplierReqBody = {
  name: string;
  address: string;
  phone_number: string;
  contract_fee: Decimal128;
};

export type UpdateSupplierReqBody = Partial<CreateSupplierReqBody>;
