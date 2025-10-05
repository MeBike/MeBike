import { ObjectId } from "mongodb";

import type { CreateContractReqBody } from "~/models/requests/contracts.requests";
import type { CreateSupplierReqBody, UpdateSupplierReqBody } from "~/models/requests/suppliers.request";
import type { ContractType } from "~/models/schemas/contract.schema";
import type { SupplierType } from "~/models/schemas/supplier.schema";

import { ContractStatus, ReportStatus, SupplierStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { REPORTS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import Supplier from "~/models/schemas/supplier.schema";

import databaseService from "./database.services";

class SupplierService {
  async createSupplier({ payload }: { payload: CreateSupplierReqBody }) {
    const supplierID = new ObjectId();
    const contracts_id = new ObjectId();
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    const supplierData: SupplierType = {
      ...payload,
      _id: supplierID,
      name: payload.name,
      address: payload.address,
      phone_number: payload.phone_number,
      contracts_id: new ObjectId(contracts_id),
      status: SupplierStatus.ACTIVE,
      created_at: localTime,
    };

    const supplier_contracts: ContractType = {
      _id: contracts_id,
      supplier_id: supplierID,
      contract_fee: payload.contract_fee,
      status: ContractStatus.ACTIVE,
      start_date: payload.start_date,
      end_date: payload.end_date,
      created_at: localTime,
      updated_at: localTime,
    };

    const result = await Promise.all([
      databaseService.suppliers.insertOne(supplierData),
      databaseService.contracts.insertOne(supplier_contracts),
    ]);

    return result;
  }

  async updateSupplier({ supplierID, payload }: { supplierID: string; payload: UpdateSupplierReqBody }) {
    const validTransitions: Record<ReportStatus, ReportStatus[]> = {
      [ReportStatus.Pending]: [ReportStatus.InProgress, ReportStatus.Cancel],
      [ReportStatus.InProgress]: [ReportStatus.Resolved],
      [ReportStatus.Resolved]: [],
      [ReportStatus.Cancel]: [],
    };

    const findReport = await databaseService.reports.findOne({ _id: new ObjectId(reportID) });
    if (!findReport) {
      throw new ErrorWithStatus({
        message: REPORTS_MESSAGES.REPORT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const currentStatus = findReport.status;
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ErrorWithStatus({
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const result = await databaseService.reports.findOneAndUpdate(
      { _id: new ObjectId(reportID) },
      { $set: { status: newStatus } },
      { returnDocument: "after" },
    );
    return result;
  }
}

const supplierService = new SupplierService();
export default supplierService;
