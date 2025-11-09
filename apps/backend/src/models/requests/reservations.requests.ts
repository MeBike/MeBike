import { ReservationOptions } from '~/constants/enums'

export type CancelReservationReqBody = {
  reason: string
}

export type ReservationParam = {
  id: string
}

export type StationParam = {
  stationId: string
}

export type DispatchBikeReqBody = {
    destination_station_id: string; 
    bike_ids_to_move: string[];         
    source_station_id: string;
}

export type ConfirmReservationByStaffReqBody = {
  reason: string
}

export type ReserveBikeReqBody = {
  reservation_option: ReservationOptions
  bike_id?: string
  start_time: string
  slot_start?: string
  slot_end?: string
  days_of_week?: number[]
  recurrence_end_date?: string
  subscription_id?: string
}


