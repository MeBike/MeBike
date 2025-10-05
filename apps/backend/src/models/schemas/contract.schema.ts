import type { Decimal128 } from "mongodb";

import { ObjectId } from "mongodb";

import { ContractStatus } from "~/constants/enums";

export type ContractType = {
  _id?: ObjectId;
  supplier_id: ObjectId;
  start_date: Date;
  end_date: Date;
  contract_fee: Decimal128;
  image_url: string;
  status: ContractStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Contract {
  _id?: ObjectId;
  supplier_id: ObjectId;
  start_date: Date;
  end_date: Date;
  contract_fee: Decimal128;
  image_url: string;
  status: ContractStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(contract: ContractType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = contract._id || new ObjectId();
    this.supplier_id = contract.supplier_id;
    this.start_date = contract.start_date;
    this.end_date = contract.end_date;
    this.contract_fee = contract.contract_fee;
    this.image_url = contract.image_url;
    this.status = contract.status || ContractStatus.ACTIVE;
    this.created_at = contract.created_at || localTime;
    this.updated_at = contract.updated_at || localTime;
  }
}
