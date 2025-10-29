import { ClientSession, Decimal128, Int32, ObjectId } from 'mongodb'

import HTTP_STATUS from '~/constants/http-status'
import { BikeStatus, RentalStatus, ReservationStatus } from '~/constants/enums'
import { RENTALS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from './database.services'
import rentalsService from './rentals.services'
import { getReservationFacade } from './reservations.facade'
import Rental from '~/models/schemas/rental.schema'
import Reservation from '~/models/schemas/reservation.schema'
import { getLocalTime } from '~/utils/date-time'
import { toObjectId } from '~/utils/string'
import walletService from './wallets.services'
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
    logger.info({
      chip_id,
      bike_id: bike._id?.toString(),
      status: bike.status,
      station_id: bike.station_id?.toString() ?? null
    }, 'Matched bike for chip')

    const activeRental = await databaseService.rentals.findOne({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId,
      status: RentalStatus.Rented
    })

    if (activeRental) {
      logger.info({
        rental_id: activeRental._id?.toString(),
        user_id: user._id?.toString()
      }, 'Detected active rental – ending session')
      const endedRental = await endRentalSessionForCard({ user_id: user._id as ObjectId, rental: activeRental })

      const reservationFacade = getReservationFacade()
      await reservationFacade.expireActiveForUserAndBike({ user_id: user._id as ObjectId, bike_id: bike._id as ObjectId })

      return { mode: 'ended', rental: endedRental }
    }

    const reservationFacade = getReservationFacade()
    const reservation = await reservationFacade.findPendingOrActiveByUserAndBike({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId
    })

    if (reservation) {
      logger.info({
        reservation_id: reservation._id.toString(),
        user_id: user._id?.toString(),
        bike_id: bike._id?.toString()
      }, 'Found reservation for user/bike; activating')

      const reservationDocument = await databaseService.reservations.findOne({
        _id: reservation._id,
        user_id: user._id as ObjectId,
        bike_id: bike._id as ObjectId
      })

      if (!reservationDocument) {
        throw new ErrorWithStatus({
          message: 'Reservation not found for card tap flow.',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      const reservationModel = new Reservation(reservationDocument as any)

      const rentalSession = await startRentalFromReservationForCard({
        reservation: reservationModel,
        bike_id: bike._id as ObjectId
      })

      logger.info({
        rental_id: (rentalSession as any)?._id?.toString?.(),
        mode: 'reservation_started'
      }, 'Rental promoted from reservation')
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
      logger.warn({
        chip_id,
        bike_id: bike._id?.toString(),
        status: bike.status
      }, 'Bike not available for rental')
      throw new ErrorWithStatus({
        message: 'Bike is not available for rental',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const startStationId = bike.station_id as ObjectId

    logger.info({
      user_id: user._id?.toString(),
      bike_id: bike._id?.toString(),
      start_station: startStationId.toString()
    }, 'Creating rental without reservation')
    const rentalSession = await createRentalSessionForCard({
      user_id: user._id as ObjectId,
      start_station: startStationId,
      bike_id: bike._id as ObjectId
    })

    logger.info({
      rental_id: (rentalSession as any)?._id?.toString?.(),
      mode: 'started'
    }, 'Rental created without reservation')
    return { mode: 'started', rental: rentalSession }
  }
}

type CreateRentalParams = {
  user_id: ObjectId
  start_station: ObjectId
  bike_id: ObjectId
}

async function createRentalSessionForCard(params: CreateRentalParams) {
  try {
    return await rentalsService.createRentalSession(params)
  } catch (error) {
    if (isTransactionNotSupportedError(error)) {
      logger.warn({
        user_id: params.user_id.toString(),
        bike_id: params.bike_id.toString()
      }, 'falling back to non-transactional rental creation')
      return await createRentalSessionWithoutTransaction(params)
    }
    throw error
  }
}

async function createRentalSessionWithoutTransaction({ user_id, start_station, bike_id }: CreateRentalParams) {
  const now = getLocalTime()
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

    // Skip IoT command for card-tap initiated rentals to avoid double actions
    // IoT device should have already sent the command when card was tapped
  } catch (error) {
    await databaseService.rentals.deleteOne({ _id: rental._id })
    throw error
  }

  return {
    ...(rental as any),
    total_price: 0
  }
}

type StartReservationParams = {
  reservation: Reservation
  bike_id: ObjectId
}

async function startRentalFromReservationForCard({ reservation, bike_id }: StartReservationParams) {
  const session = databaseService.getClient().startSession()
  const now = getLocalTime()

  const executePromotion = async (activeSession?: ClientSession) => {
    const options = activeSession ? { session: activeSession } : undefined

    const reservedRental = await databaseService.rentals.findOne(
      {
        _id: reservation._id,
        user_id: reservation.user_id,
        status: RentalStatus.Reserved
      },
      options
    )

    if (!reservedRental) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.NOT_FOUND_RESERVED_RENTAL.replace('%s', reservation._id!.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updateResult = await databaseService.rentals.findOneAndUpdate(
      { _id: reservation._id },
      {
        $set: {
          start_time: now,
          status: RentalStatus.Rented,
          updated_at: now
        }
      },
      {
        returnDocument: 'after',
        ...(options ?? {})
      }
    )

    const promotedRental =
      (updateResult as { value?: Rental | null } | null)?.value ?? (reservedRental as Rental)

    await databaseService.reservations.updateOne(
      { _id: reservation._id },
      {
        $set: {
          status: ReservationStatus.Active,
          updated_at: now
        }
      },
      options
    )

    await databaseService.bikes.updateOne(
      { _id: bike_id },
      {
        $set: {
          station_id: null,
          status: BikeStatus.Booked,
          updated_at: now
        }
      },
      options
    )

    // Skip IoT command for card-tap initiated reservation activation to avoid double actions
    // IoT device should have already sent the command when card was tapped

    return promotedRental
  }

  try {
    let promotedRental: Rental | null = null
    try {
      promotedRental = await session.withTransaction(async () => {
        const result = await executePromotion(session)
        return result
      })
    } catch (error) {
      if (isTransactionNotSupportedError(error)) {
        logger.warn({
          reservation_id: reservation._id?.toString()
        }, 'falling back to non-transactional reservation promotion')
        promotedRental = await executePromotion()
      } else {
        throw error
      }
    }

    if (!promotedRental) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.RENTAL_UPDATE_FAILED.replace('%s', reservation._id!.toString()),
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    return {
      ...(promotedRental as any),
      total_price: Number.parseFloat(promotedRental.total_price.toString())
    }
  } finally {
    await session.endSession()
  }
}

type EndRentalParams = {
  user_id: ObjectId
  rental: Rental
}

async function endRentalSessionForCard({ user_id, rental }: EndRentalParams) {
  try {
    const result = await rentalsService.endRentalSession({ user_id, rental })
    await chargeWalletAfterEnd({
      user_id,
      rental_id: (result as any)._id ? toObjectId((result as any)._id) : (rental._id as ObjectId),
      bike_id: rental.bike_id as ObjectId,
      total_price: Number(result.total_price)
    })
    return result
  } catch (error) {
    if (isTransactionNotSupportedError(error) || isRentalUpdateFailed(error)) {
      logger.warn({
        rental_id: rental._id?.toString(),
        user_id: user_id.toString()
      }, 'falling back to non-transactional rental ending')
      const endedRental = await endRentalSessionWithoutTransaction({ user_id, rental })
      const totalPriceNumber = Number.parseFloat(endedRental.total_price.toString())
      await chargeWalletAfterEnd({
        user_id,
        rental_id: endedRental._id as ObjectId,
        bike_id: endedRental.bike_id as ObjectId,
        total_price: totalPriceNumber
      })
      return {
        ...endedRental,
        total_price: totalPriceNumber
      }
    }
    throw error
  }
}

async function endRentalSessionWithoutTransaction({ user_id, rental }: EndRentalParams) {
  const user = await databaseService.users.findOne({ _id: user_id })
  if (!user) {
    throw new ErrorWithStatus({
      message: RENTALS_MESSAGE.USER_NOT_FOUND.replace('%s', user_id.toString()),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  const end_station_id = rental.start_station as ObjectId
  const effective_end_time = getLocalTime()

  const persistedRental = await finalizeRentalWithoutTransaction({
    rental,
    user_id,
    end_station_id,
    effective_end_time
  })



  return persistedRental
}

async function finalizeRentalWithoutTransaction({
  rental,
  user_id,
  end_station_id,
  effective_end_time
}: {
  rental: Rental
  user_id: ObjectId
  end_station_id: ObjectId
  effective_end_time: Date
}) {
  const now = getLocalTime()

  const duration = rentalsService.generateDuration(rental.start_time, effective_end_time)
  let totalPrice = rentalsService.generateTotalPrice(duration)

  const reservation = await databaseService.reservations.findOne({ _id: rental._id })
  if (reservation) {
    totalPrice = Math.max(0, totalPrice - Number.parseFloat(reservation.prepaid.toString()))
    await databaseService.reservations.updateOne(
      { _id: rental._id },
      { $set: { status: ReservationStatus.Expired, updated_at: now } }
    )
  }

  const decimalTotalPrice = Decimal128.fromString(totalPrice.toString())

  const updatedData: Partial<Rental> = {
    end_station: end_station_id,
    end_time: effective_end_time,
    duration: new Int32(duration),
    total_price: decimalTotalPrice,
    status: RentalStatus.Completed
  }

  const updateResult = await databaseService.rentals.findOneAndUpdate(
    { _id: rental._id },
    { $set: { ...updatedData, updated_at: now } },
    { returnDocument: 'after' }
  )

  let persistedRental = (updateResult as { value?: Rental | null } | null)?.value ?? null

  if (!persistedRental) {
    const plainUpdate = await databaseService.rentals.updateOne(
      { _id: rental._id },
      { $set: { ...updatedData, updated_at: now } }
    )

    if (!plainUpdate.matchedCount) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.RENTAL_UPDATE_FAILED.replace('%s', rental._id!.toString()),
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    persistedRental = (await databaseService.rentals.findOne({ _id: rental._id })) as Rental | null

    if (!persistedRental) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.RENTAL_UPDATE_FAILED.replace('%s', rental._id!.toString()),
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  const bikeUpdateResult = await databaseService.bikes.updateOne(
    { _id: persistedRental.bike_id },
    { $set: { station_id: end_station_id, status: BikeStatus.Available, updated_at: now } }
  )

  if (!bikeUpdateResult.matchedCount) {
    throw new ErrorWithStatus({
      message: RENTALS_MESSAGE.BIKE_NOT_FOUND.replace('%s', persistedRental.bike_id.toString()),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  return persistedRental
}

async function chargeWalletAfterEnd({
  user_id,
  rental_id,
  bike_id,
  total_price
}: {
  user_id: ObjectId
  rental_id: ObjectId
  bike_id: ObjectId
  total_price: number
}) {
  const decimalTotalPrice = Decimal128.fromString(total_price.toString())
  const description = RENTALS_MESSAGE.PAYMENT_DESCRIPTION.replace('%s', bike_id.toString())

  const walletBefore = await databaseService.wallets.findOne({ user_id })
  logger.debug({
    wallet_id: walletBefore?._id?.toString() ?? null,
    balance: walletBefore ? Number.parseFloat(walletBefore.balance.toString()) : null
  }, 'wallet state before charge')

  await walletService.paymentRental(user_id.toString(), decimalTotalPrice, description, rental_id)

  const walletAfter = await databaseService.wallets.findOne({ user_id })
  logger.debug({
    wallet_id: walletAfter?._id?.toString() ?? null,
    balance: walletAfter ? Number.parseFloat(walletAfter.balance.toString()) : null
  }, 'wallet state after charge')

  const latestTransaction = await databaseService.transactions.findOne(
    { rental_id },
    { sort: { created_at: -1 } }
  )
  logger.debug({
    transaction_id: latestTransaction?._id?.toString() ?? null,
    amount: latestTransaction ? Number.parseFloat(latestTransaction.amount.toString()) : null,
    type: latestTransaction?.type ?? null
  }, 'latest transaction snapshot')
}

function isTransactionNotSupportedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 20
  )
}

function isRentalUpdateFailed(error: unknown): boolean {
  return (
    error instanceof ErrorWithStatus &&
    error.status === HTTP_STATUS.INTERNAL_SERVER_ERROR &&
    typeof error.message === 'string' &&
    error.message.startsWith(RENTALS_MESSAGE.RENTAL_UPDATE_FAILED.split('%s')[0])
  )
}
