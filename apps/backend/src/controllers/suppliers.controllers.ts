import type { NextFunction, Request, Response } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'

import { ObjectId } from 'mongodb'

import { Role, SupplierStatus } from '~/constants/enums'
import type {
  CreateSupplierReqBody,
  GetSupplierReqQuery,
  UpdateSupplierReqBody
} from '~/models/requests/suppliers.request'

import HTTP_STATUS from '~/constants/http-status'
import { SUPPLIER_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import supplierService from '~/services/supplier.services'

export async function createSupplierController(req: Request<any, any, CreateSupplierReqBody>, res: Response) {
  const result = await supplierService.createSupplier({
    payload: req.body
  })

  res.json({
    message: SUPPLIER_MESSAGE.CREATE_SUCCESS,
    result
  })
}

export async function updateSupplierController(
  req: Request<ParamsDictionary, any, UpdateSupplierReqBody>,
  res: Response
) {
  const supplierID = req.params.id

  const result = await supplierService.updateSupplier({ id: supplierID.toString(), payload: req.body })

  res.json({
    messgae: SUPPLIER_MESSAGE.UPDATE_SUCCESS,
    result
  })
}

export async function changeSupplierStatusController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const supplierID = req.params.id
  const { newStatus } = req.body

  const result = await supplierService.updateStatus({
    id: supplierID.toString(),
    newStatus: newStatus as SupplierStatus
  })

  res.json({
    message: SUPPLIER_MESSAGE.UPDATE_SUCCESS,
    result
  })
}

export async function getByIdController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const supplierID = req.params.id

  const result = await databaseService.suppliers.findOne({ _id: new ObjectId(supplierID) })
  if (!result) {
    throw new ErrorWithStatus({
      message: SUPPLIER_MESSAGE.SUPPLIER_NOT_FOUND.replace('%s', supplierID),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  res.json({
    message: SUPPLIER_MESSAGE.GET_BY_ID_SUCCESS.replace('%s', supplierID),
    result
  })
}

export async function getAllSupplierStatController(req: Request<any, any, any>, res: Response) {
  const resutl = await supplierService.getAllSupplierBikeStats()

  res.json({
    message: SUPPLIER_MESSAGE.GET_STATS_SUCCESS,
    resutl
  })
}

export async function getSupplierStatController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const supplierID = req.params.id
  const result = await supplierService.getSupplierBikeStats(supplierID)

  res.json({
    message: SUPPLIER_MESSAGE.GET_STATS_SUCCESS_BY_ID.replace('%s', supplierID),
    result
  })
}

export async function getAllSupplierController(
  req: Request<ParamsDictionary, any, any, GetSupplierReqQuery>,
  res: Response,
  next: NextFunction
) {
  const query = req.query

  await supplierService.getAllSupplier(res, next, query)
}
