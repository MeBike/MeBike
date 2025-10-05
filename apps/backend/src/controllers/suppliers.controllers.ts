import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import type { SupplierStatus } from "~/constants/enums";
import type { CreateSupplierReqBody, UpdateSupplierReqBody } from "~/models/requests/suppliers.request";

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

export async function updateSupplierController(
  req: Request<ParamsDictionary, any, UpdateSupplierReqBody>,
  res: Response,
) {
  const supplierID = req.params.id;

  const result = await supplierService.updateSupplier({ id: supplierID.toString(), payload: req.body });

  res.json({
    messgae: SUPPLIER_MESSAGE.UPDATE_SUCCESS,
    result,
  });
}

export async function changeSupplierStatusController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const supplierID = req.params.id;
  const { newStatus } = req.body;

  const result = await supplierService.updateStatus({ id: supplierID.toString(), newStatus: newStatus as SupplierStatus });

  res.json({
    message: SUPPLIER_MESSAGE.UPDATE_SUCCESS,
    result,
  });
}
