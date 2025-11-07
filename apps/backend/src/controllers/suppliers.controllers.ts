import type { NextFunction, Request, Response } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'

import { Filter, ObjectId } from 'mongodb'

import { SupplierStatus } from '~/constants/enums'
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
import util from 'node:util'
import Supplier from '~/models/schemas/supplier.schema'

export async function createSupplierController(req: Request<any, any, CreateSupplierReqBody>, res: Response) {
  try {
    const result = await supplierService.createSupplier({
      payload: req.body
    })

    res.json({
      message: SUPPLIER_MESSAGE.CREATE_SUCCESS,
      result
    })
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.name) {
      const message = util.format(SUPPLIER_MESSAGE.SUPPLIER_NAME_DUPLICATED)
      res.status(400).json({ message })
      return
    }

    const statusCode = error instanceof ErrorWithStatus ? error.status : 500
    res.status(statusCode).json({ status: statusCode, message: error?.message ?? 'Internal Server Error' })
  }
}

export async function updateSupplierController(
  req: Request<ParamsDictionary, any, UpdateSupplierReqBody>,
  res: Response
) {
  try {
    const supplierID = req.params.id

    const result = await supplierService.updateSupplier({ id: supplierID.toString(), payload: req.body })

    res.json({
      message: SUPPLIER_MESSAGE.UPDATE_SUCCESS,
      result
    })
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.name) {
      const message = util.format(SUPPLIER_MESSAGE.SUPPLIER_NAME_DUPLICATED)
      res.status(400).json({ message })
      return
    }

    const statusCode = error instanceof ErrorWithStatus ? error.status : 500
    res.status(statusCode).json({ status: statusCode, message: error?.message ?? 'Internal Server Error' })
  }
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
  const result = await supplierService.getAllSupplierBikeStats()

  res.json({
    message: SUPPLIER_MESSAGE.GET_STATS_SUCCESS,
    result
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
