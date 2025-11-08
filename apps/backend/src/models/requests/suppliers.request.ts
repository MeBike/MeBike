import type { Decimal128 } from 'mongodb'
import { SupplierStatus } from '~/constants/enums'

export type CreateSupplierReqBody = {
  name: string
  address: string
  phone_number: string
  contract_fee: Decimal128
}

export type GetSupplierReqQuery = {
  status?: SupplierStatus
  limit?: string
  page?: string
  name?: string
}

export type UpdateSupplierReqBody = Partial<CreateSupplierReqBody>
