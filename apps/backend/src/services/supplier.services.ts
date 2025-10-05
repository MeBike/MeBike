import { ObjectId } from "mongodb";

import type { CreateSupplierReqBody, UpdateSupplierReqBody } from "~/models/requests/suppliers.request";
import type { SupplierType } from "~/models/schemas/supplier.schema";

import { SupplierStatus } from "~/constants/enums";
import Supplier from "~/models/schemas/supplier.schema";

import databaseService from "./database.services";

class SupplierService {
  async createSupplier({ payload }: { payload: CreateSupplierReqBody }) {
    const supplierID = new ObjectId();

    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    const supplierData: SupplierType = {
      _id: supplierID,
      name: payload.name,
      contact_info: {
        address: payload.address,
        phone_number: payload.phone_number,
      },
      contract_fee: payload.contract_fee,
      status: SupplierStatus.ACTIVE,
      created_at: localTime,
    };

    const result = await databaseService.suppliers.insertOne(new Supplier(supplierData));

    return result;
  }

  async updateSupplier({ id, payload }: { id: string; payload: UpdateSupplierReqBody }) {
    const updateData: any = {};

    if (payload.address) {
      updateData["contact_info.address"] = payload.address;
    }
    if (payload.phone_number) {
      updateData["contact_info.phone_number"] = payload.phone_number;
    }
    if (payload.name) {
      updateData.name = payload.name;
    }
    if (payload.contract_fee) {
      updateData.contract_fee = payload.contract_fee;
    }

    const result = await databaseService.suppliers.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    return result;
  }

  async updateStatus({ id, newStatus }: { id: string; newStatus: SupplierStatus }) {
    // eslint-disable-next-line no-console
    console.log(newStatus);
    const result = await databaseService.suppliers.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: newStatus } },
      { returnDocument: "after" },
    );

    return result;
  }
}

const supplierService = new SupplierService();
export default supplierService;
