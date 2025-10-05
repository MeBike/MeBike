import { ObjectId } from "mongodb";

import { SupplierStatus } from "~/constants/enums";

export type SupplierType = {
  _id?: ObjectId;
  name: string;
  address: string;
  phone_number: string;
  contracts_id: ObjectId;
  status: SupplierStatus;
  created_at?: Date;
};

export default class Supplier {
  _id?: ObjectId;
  name: string;
  address: string;
  phone_number: string;
  contracts_id?: ObjectId;
  status: SupplierStatus;
  created_at?: Date;

  constructor(supplier: SupplierType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = supplier._id || new ObjectId();
    this.name = supplier.name;
    this.address = supplier.address;
    this.phone_number = supplier.phone_number;
    this.contracts_id = supplier.contracts_id;
    this.status = supplier.status || SupplierStatus.ACTIVE;
    this.created_at = supplier.created_at || localTime;
  }
}
