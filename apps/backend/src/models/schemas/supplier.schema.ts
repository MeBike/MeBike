import type { Decimal128 } from 'mongodb'

import { ObjectId } from 'mongodb'

import { SupplierStatus } from '~/constants/enums'

export type ContactInfo = {
  address: string
  phone_number: string
}

export type SupplierType = {
  _id?: ObjectId
  name: string
  contact_info: ContactInfo
  contract_fee: Decimal128
  status: SupplierStatus
  created_at?: Date
  updated_at?: Date
}

export default class Supplier {
  _id?: ObjectId
  name: string
  contact_info: ContactInfo
  contract_fee: Decimal128
  status: SupplierStatus
  created_at?: Date
  updated_at?: Date

  constructor(supplier: SupplierType) {
    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    this._id = supplier._id || new ObjectId()
    this.name = supplier.name
    this.contact_info = supplier.contact_info
    this.contract_fee = supplier.contract_fee
    this.status = supplier.status || SupplierStatus.ACTIVE
    this.created_at = supplier.created_at || localTime
    this.updated_at = supplier.updated_at || localTime
  }
}
