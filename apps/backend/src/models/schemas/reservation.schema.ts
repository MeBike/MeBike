import { Decimal128, ObjectId } from 'mongodb'
import { ReservationOptions, ReservationStatus } from '~/constants/enums'
import { getLocalTime } from '~/utils/date-time'

type ReservationType = {
  _id?: ObjectId
  user_id: ObjectId
  bike_id?: ObjectId
  station_id: ObjectId
  start_time: Date
  end_time?: Date
  prepaid: Decimal128
  status?: ReservationStatus
  reservation_option: ReservationOptions
  fixed_slot_template_id?: ObjectId
  subscription_id?: ObjectId
  created_at?: Date
  updated_at?: Date
}

export default class Reservation {
  _id?: ObjectId
  user_id: ObjectId
  bike_id?: ObjectId
  station_id: ObjectId
  start_time: Date
  end_time?: Date
  prepaid: Decimal128
  status: ReservationStatus
  reservation_option: ReservationOptions
  fixed_slot_template_id?: ObjectId
  subscription_id?: ObjectId
  created_at?: Date
  updated_at?: Date

  constructor(reservation: ReservationType) {
    const localTime = getLocalTime()
    const holdTimeMs = Number(process.env.HOLD_HOURS_RESERVATION || '1') * 60 * 60 * 1000

    if (
      reservation.reservation_option === ReservationOptions.FIXED_SLOT &&
      !reservation.fixed_slot_template_id
    ) {
      throw new Error('fixed_slot_template_id is required when reservation_option is FIXED_SLOT')
    }

    if (
      reservation.reservation_option === ReservationOptions.SUBSCRIPTION &&
      !reservation.subscription_id
    ) {
      throw new Error('subscription_id is required when reservation_option is SUBSCRIPTION')
    }

    this._id = reservation._id || new ObjectId()
    this.user_id = reservation.user_id
    this.bike_id = reservation.bike_id ?? undefined
    this.station_id = reservation.station_id
    this.start_time = reservation.start_time
    this.end_time = reservation.end_time
    this.prepaid = reservation.prepaid instanceof Decimal128
      ? reservation.prepaid
      : Decimal128.fromString(String(reservation.prepaid ?? 0))
    this.status = reservation.status ?? ReservationStatus.Pending
    this.reservation_option = reservation.reservation_option
    this.fixed_slot_template_id = reservation.fixed_slot_template_id ?? undefined
    this.subscription_id = reservation.subscription_id ?? undefined

    // Chỉ tự động +1 giờ nếu là ONE_TIME
    if (this.reservation_option === ReservationOptions.ONE_TIME && !this.end_time) {
      this.end_time = new Date(this.start_time.getTime() + holdTimeMs)
    }

    this.created_at = reservation.created_at || localTime
    this.updated_at = reservation.updated_at || localTime
  }
}
