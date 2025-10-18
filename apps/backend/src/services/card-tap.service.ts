import type { ObjectId } from 'mongodb'

import HTTP_STATUS from '~/constants/http-status'
import { BikeStatus, RentalStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/errors'
import { getReservationFacade } from './reservations.facade'
import rentalsService from './rentals.services'
import databaseService from './database.services'

export type CardTapRequest = { chip_id: string; card_uid: string }
export type CardTapMode = 'started' | 'ended' | 'reservation_started'

export const cardTapService = {
  async handleCardTap({ chip_id, card_uid }: CardTapRequest): Promise<{ mode: CardTapMode; rental: unknown }> {
    const user = await databaseService.users.findOne({ nfc_card_uid: card_uid })
    if (!user) {
      throw new ErrorWithStatus({
        message: 'User not found for the provided card.',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const bike = await databaseService.bikes.findOne({ chip_id })
    if (!bike) {
      throw new ErrorWithStatus({
        message: `Bike with chip_id ${chip_id} not found or unavailable.`,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const activeRental = await databaseService.rentals.findOne({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId,
      status: RentalStatus.Rented
    })

    if (activeRental) {
      const endedRental = await rentalsService.endRentalSession({ user_id: user._id as ObjectId, rental: activeRental })
      return { mode: 'ended', rental: endedRental }
    }

    const reservationFacade = getReservationFacade()
    const reservation = await reservationFacade.findPendingOrActiveByUserAndBike({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId
    })

    if (reservation) {
      await reservationFacade.activateReservation({ reservation_id: reservation._id })

      const rentalSession = await rentalsService.createRentalSession({
        user_id: user._id as ObjectId,
        start_station: (bike.station_id ?? reservation.station_id) as ObjectId,
        bike_id: bike._id as ObjectId
      })

      return { mode: 'reservation_started', rental: rentalSession }
    }

    if (!bike.station_id) {
      throw new ErrorWithStatus({
        message: `Bike with chip_id ${chip_id} not found or unavailable.`,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (bike.status !== BikeStatus.Available) {
      throw new ErrorWithStatus({
        message: 'Bike is not available for rental',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const rentalSession = await rentalsService.createRentalSession({
      user_id: user._id as ObjectId,
      start_station: bike.station_id,
      bike_id: bike._id as ObjectId
    })

    return { mode: 'started', rental: rentalSession }
  }
}

