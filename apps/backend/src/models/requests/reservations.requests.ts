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

export type DispatchBikeReqBody = {
    destination_station_id: string; 
    bike_ids_to_move: string[];         
    source_station_id: string;
}

export type ConfirmReservationByStaffReqBody = {
  reason: string
}

export type StaffConfirmReservation = {
  staff_id: ObjectId
  reason: string
}


