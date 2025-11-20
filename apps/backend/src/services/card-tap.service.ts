import { ObjectId } from 'mongodb'

import HTTP_STATUS from '~/constants/http-status'
import { BikeStatus, RentalStatus, ReservationStatus } from '~/constants/enums'
import { RENTALS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from './database.services'
import rentalsService from './rentals.services'
import reservationsService from './reservations.services'
import Rental from '~/models/schemas/rental.schema'
import Reservation from '~/models/schemas/reservation.schema'
import { getLocalTime } from '~/utils/date-time'
import { toObjectId } from '~/utils/string'
import Bike from '~/models/schemas/bike.schema'
import logger from '~/lib/logger'

export type CardTapRequest = { chip_id: string; card_uid: string }
export type CardTapMode = 'started' | 'ended' | 'reservation_started'

export const cardTapService = {
  async handleCardTap({ chip_id, card_uid }: CardTapRequest): Promise<{ mode: CardTapMode; rental: unknown }> {
    const user = await databaseService.users.findOne({ nfc_card_uid: card_uid })
    if (!user) {
      logger.warn({ card_uid }, 'No user bound to card')
      throw new ErrorWithStatus({
        message: 'User not found for the provided card.',
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    logger.info({ card_uid, user_id: user._id?.toString() }, 'Matched user for card')

    const bike = await databaseService.bikes.findOne({ chip_id })
    if (!bike) {
      logger.warn({ chip_id }, 'Bike not found for chip')
      throw new ErrorWithStatus({
        message: `Bike with chip_id ${chip_id} not found or unavailable.`,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    logger.info(
      {
        chip_id,
        bike_id: bike._id?.toString(),
        status: bike.status,
        station_id: bike.station_id?.toString() ?? null
      },
      'Matched bike for chip'
    )

    const activeRental = await databaseService.rentals.findOne({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId,
      status: RentalStatus.Rented
    })

    if (activeRental) {
      logger.warn(
        {
          rental_id: activeRental._id?.toString(),
          user_id: user._id?.toString()
        },
        'Card tap detected existing active rental for user/bike'
      )
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.CARD_RENTAL_ACTIVE_EXISTS,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const reservationDocument = await databaseService.reservations.findOne({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId,
      status: ReservationStatus.Pending
    })

    if (reservationDocument) {
      logger.info(
        {
          reservation_id: reservationDocument._id?.toString(),
          user_id: user._id?.toString(),
          bike_id: bike._id?.toString()
        },
        'Found pending reservation for user/bike; activating'
      )

      const reservationModel = new Reservation(reservationDocument as any)

      const rentalSession = await reservationsService.confirmReservation({
        user_id: user._id as ObjectId,
        reservation: reservationModel
      })

      logger.info(
        {
          rental_id: (rentalSession as any)?._id?.toString?.(),
          mode: 'reservation_started'
        },
        'Rental promoted from reservation'
      )
      return { mode: 'reservation_started', rental: rentalSession }
    }

    if (!bike.station_id) {
      logger.warn({ chip_id }, 'Bike missing station when attempting fresh rental')
      throw new ErrorWithStatus({
        message: `Bike with chip_id ${chip_id} not found or unavailable.`,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (bike.status !== BikeStatus.Available) {
      logger.warn(
        {
          chip_id,
          bike_id: bike._id?.toString(),
          status: bike.status
        },
        'Bike not available for rental'
      )
      throw new ErrorWithStatus({
        message: 'Bike is not available for rental',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const startStationId = bike.station_id as ObjectId

    logger.info(
      {
        user_id: user._id?.toString(),
        bike_id: bike._id?.toString(),
        start_station: startStationId.toString()
      },
      'Creating rental without reservation'
    )
    const rentalSession = await createRentalSessionForCard({
      user_id: user._id as ObjectId,
      start_station: startStationId,
      bike
    })

    logger.info(
      {
        rental_id: (rentalSession as any)?._id?.toString?.(),
        mode: 'started'
      },
      'Rental created without reservation'
    )
    return { mode: 'started', rental: rentalSession }
  }
}

type CreateRentalParams = {
  user_id: ObjectId
  start_station: ObjectId
  bike: Bike
}

async function createRentalSessionForCard(params: CreateRentalParams) {
  try {
    return await rentalsService.createRentalSession(params)
  } catch (error) {
    if (isTransactionNotSupportedError(error)) {
      logger.warn(
        {
          user_id: params.user_id.toString(),
          bike_id: params.bike._id?.toString()
        },
        'falling back to non-transactional rental creation'
      )
      return await createRentalSessionWithoutTransaction(params)
    }
    throw error
  }
}

async function createRentalSessionWithoutTransaction({ user_id, start_station, bike }: CreateRentalParams) {
  const now = getLocalTime()
  const bike_id = bike._id as ObjectId
  const rental = new Rental({
    user_id: toObjectId(user_id),
    start_station,
    bike_id,
    start_time: now,
    status: RentalStatus.Rented
  })

  await databaseService.rentals.insertOne(rental)

  try {
    const updateResult = await databaseService.bikes.updateOne(
      { _id: bike_id },
      {
        $set: {
          station_id: null,
          status: BikeStatus.Booked,
          updated_at: now
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.BIKE_NOT_FOUND.replace('%s', bike_id.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }
  } catch (error) {
    await databaseService.rentals.deleteOne({ _id: rental._id })
    throw error
  }

  return {
    ...(rental as any),
    total_price: 0
  }
}
function isTransactionNotSupportedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 20
  )
}
