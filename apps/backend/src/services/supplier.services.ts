import { ObjectId } from 'mongodb'

import type { CreateSupplierReqBody, UpdateSupplierReqBody } from '~/models/requests/suppliers.request'
import type { SupplierType } from '~/models/schemas/supplier.schema'
import type { SupplierBikeStats } from '~/models/schemas/user.schema'

import { SupplierStatus } from '~/constants/enums'
import Supplier from '~/models/schemas/supplier.schema'

import databaseService from './database.services'

class SupplierService {
  async createSupplier({ payload }: { payload: CreateSupplierReqBody }) {
    const supplierID = new ObjectId()

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const supplierData: SupplierType = {
      _id: supplierID,
      name: payload.name,
      contact_info: {
        address: payload.address,
        phone_number: payload.phone_number
      },
      contract_fee: payload.contract_fee,
      status: SupplierStatus.ACTIVE,
      created_at: localTime
    }

    const result = await databaseService.suppliers.insertOne(new Supplier(supplierData))

    return result
  }

  async updateSupplier({ id, payload }: { id: string; payload: UpdateSupplierReqBody }) {
    const updateData: any = {}

    if (payload.address) {
      updateData['contact_info.address'] = payload.address
    }
    if (payload.phone_number) {
      updateData['contact_info.phone_number'] = payload.phone_number
    }
    if (payload.name) {
      updateData.name = payload.name
    }
    if (payload.contract_fee) {
      updateData.contract_fee = payload.contract_fee
    }

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    updateData.updated_at = localTime

    const result = await databaseService.suppliers.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async updateStatus({ id, newStatus }: { id: string; newStatus: SupplierStatus }) {
    const updateData: any = {}
    updateData.status = newStatus

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    updateData.updated_at = localTime

    const result = await databaseService.suppliers.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async getAllSupplierBikeStats() {
    const result = await databaseService.suppliers
      .aggregate<SupplierBikeStats>([
        {
          $lookup: {
            from: 'bikes',
            localField: '_id',
            foreignField: 'supplier_id',
            as: 'bikes'
          }
        },
        {
          $project: {
            _id: 0,
            supplier_id: '$_id',
            supplier_name: '$name',
            total_bikes: { $size: '$bikes' },
            active_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'AVAILABLE'] }
                }
              }
            },
            booked_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'BOOKED'] }
                }
              }
            },
            broken_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'BROKEN'] }
                }
              }
            },
            reserve_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'RESERVED'] }
                }
              }
            },
            maintain_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'MAINTAINED'] }
                }
              }
            },
            unavailable_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'UNAVAILABLE'] }
                }
              }
            }
          }
        }
      ])
      .toArray()

    return result
  }

  async getSupplierBikeStats(supplierID: string) {
    const result = await databaseService.suppliers
      .aggregate<SupplierBikeStats>([
        {
          $match: {
            _id: new ObjectId(supplierID)
          }
        },
        {
          $lookup: {
            from: 'bikes',
            localField: '_id',
            foreignField: 'supplier_id',
            as: 'bikes'
          }
        },
        {
          $project: {
            _id: 0,
            supplier_id: '$_id',
            supplier_name: '$name',
            total_bikes: { $size: '$bikes' },
            active_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'AVAILABLE'] }
                }
              }
            },
            booked_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'BOOKED'] }
                }
              }
            },
            broken_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'BROKEN'] }
                }
              }
            },
            reserve_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'RESERVED'] }
                }
              }
            },
            maintain_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'MAINTAINED'] }
                }
              }
            },
            unavailable_bikes: {
              $size: {
                $filter: {
                  input: '$bikes',
                  as: 'b',
                  cond: { $eq: ['$$b.status', 'UNAVAILABLE'] }
                }
              }
            }
          }
        }
      ])
      .toArray()

    return result
  }
}

const supplierService = new SupplierService()
export default supplierService
