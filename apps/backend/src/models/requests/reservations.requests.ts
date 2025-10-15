import type { ObjectId } from 'mongodb'

export type ReserveBikeReqBody = {
  bike_id: ObjectId
  start_time: string
}


