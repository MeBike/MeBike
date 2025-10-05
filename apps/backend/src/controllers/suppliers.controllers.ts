import type { Request, Response } from "express";

import type { CreateSupplierReqBody } from "~/models/requests/suppliers.request";

import HTTP_STATUS from "~/constants/http-status";
import { SUPPLIER_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import supplierService from "~/services/supplier.services";

export async function createSupplierController(req: Request<any, any, CreateSupplierReqBody>, res: Response) {
  if (!req.file) {
    throw new ErrorWithStatus({
      message: SUPPLIER_MESSAGE.CONTRACT_IMAGE_IS_REQUIRED,
      status: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const result = await supplierService.createSupplier({
    payload: req.body,
    image: req.file as Express.Multer.File,
  });

  res.json({
    message: SUPPLIER_MESSAGE.CREATE_SUCCESS,
    result: { acknowledged: true, insertedId: result._id },
  });
}
