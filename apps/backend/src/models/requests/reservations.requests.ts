import type { ObjectId } from 'mongodb'

export type ReserveBikeReqBody = {
  bike_id: ObjectId
  start_time: string
}

export type CancelReservationReqBody = {
  reason?: string
}

export type ReservationParam = {
  id: string
}


