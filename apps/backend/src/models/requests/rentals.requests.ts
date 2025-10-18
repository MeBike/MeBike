import type { ObjectId } from 'mongodb'
import { BikeStatus, RentalStatus } from '~/constants/enums'

export type CreateRentalReqBody = {
  bike_id: ObjectId
}

export type CardRentalReqBody = {
  chip_id: string;
  card_uid: string;
};

export type RentalParams = {
  id: string
}

export type UpdateRentalReqBody = {
  end_station?: string
  end_time?: string
  status?: RentalStatus
  total_price?: number
  reason: string
}

export type CancelRentalReqBody = {
  bikeStatus?: BikeStatus
  reason: string
}

export type EndRentalByAdminOrStaffReqBody = {
  end_station: string,
  end_time?: string
  reason: string
}
