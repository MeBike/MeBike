import { Request } from 'express'
import { Filter, ObjectId } from 'mongodb'
import { ReservationStatus, Role, SosAlertStatus, SubscriptionStatus } from '~/constants/enums'
import { toObjectId } from './string'
import { RESERVATIONS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import HTTP_STATUS from '~/constants/http-status'
import User from '~/models/schemas/user.schema'
import Rental from '~/models/schemas/rental.schema'
import SosAlert from '~/models/schemas/sos-alert.schema'

interface ReservationFilter {
  user_id?: ObjectId
  station_id?: ObjectId
  status?: ReservationStatus | { $in: ReservationStatus[] }
  created_at?: { $gte?: Date; $lte?: Date }
}

export function buildAdminReservationFilter(query: Request['query']): Filter<ReservationFilter> {
  let filter: Filter<ReservationFilter> = {}

  const { userId, stationId, status, startDate, endDate } = query

  if (userId) {
    try {
      filter.user_id = toObjectId(userId as string)
    } catch (error) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.INVALID_USER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
  }

  if (stationId) {
    try {
      filter.station_id = toObjectId(stationId as string)
    } catch (error) {
      console.error(RESERVATIONS_MESSAGE.INVALID_STATION_ID)
    }
  }

  if (status) {
    filter.status = status as ReservationStatus
  } else {
    filter.status = {
      $in: [ReservationStatus.Pending, ReservationStatus.Active, ReservationStatus.Cancelled, ReservationStatus.Expired]
    }
  }

  if (startDate || endDate) {
    filter.created_at = {}
    if (startDate) {
      filter.created_at.$gte = new Date(startDate as string)
    }
    if (endDate) {
      const end = new Date(endDate as string)
      end.setDate(end.getDate() + 1)
      filter.created_at.$lte = end
    }
  }

  return filter
}

export function buildAdminSubscriptionFilter(query: any) {
  const filter: any = {}

  if (query.user_id) filter.user_id = toObjectId(query.user_id)
  if (query.package_name) filter.package_name = query.package_name
  if (query.status && Object.values(SubscriptionStatus).includes(query.status)) filter.status = query.status
  if (query.start_date || query.end_date) {
    filter.created_at = {}
    if (query.start_date) filter.created_at.$gte = new Date(query.start_date)
    if (query.end_date) filter.created_at.$lte = new Date(query.end_date)
  }

  return filter
}

export function buildSosFilterByRole(user: User) {
  const filter: any = {};

  if (user.role === Role.User) {
    filter.requester_id = user._id;
  }

  else if (user.role === Role.Sos) {
    filter.sos_agent_id = user._id;

    filter.status = {
      $nin: [SosAlertStatus.PENDING, SosAlertStatus.CANCELLED]
    };

  }

  return filter
}

