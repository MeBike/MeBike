import type { Decimal128 } from "mongodb";

export type CreateContractReqBody = {
  supplier_id: string;
  start_date: Date;
  end_date: Date;
  contract_fee: Decimal128;
};

export type UpdateSupplierReqBody = Partial<CreateContractReqBody>;
