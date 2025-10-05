import type { Request, Response } from "express";

import type { CreateSupplierReqBody } from "~/models/requests/suppliers.request";

import { SUPPLIER_MESSAGE } from "~/constants/messages";
import supplierService from "~/services/supplier.services";

export async function createSupplierController(req: Request<any, any, CreateSupplierReqBody>, res: Response) {
  const result = await supplierService.createSupplier({
    payload: req.body,
  });

  res.json({
    message: SUPPLIER_MESSAGE.CREATE_SUCCESS,
    result,
  });
}
