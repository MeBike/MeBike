import { Decimal128, Int32, ObjectId } from 'mongodb'

import HTTP_STATUS from '~/constants/http-status'
import { BikeStatus, RentalStatus, ReservationStatus } from '~/constants/enums'
import { RENTALS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from './database.services'
import rentalsService from './rentals.services'
import { getReservationFacade } from './reservations.facade'
import Rental from '~/models/schemas/rental.schema'
import { getLocalTime } from '~/utils/date'
import { toObjectId } from '~/utils/string'
import walletService from './wallets.services'

export type CardTapRequest = { chip_id: string; card_uid: string }
export type CardTapMode = 'started' | 'ended' | 'reservation_started'

export const cardTapService = {
  async handleCardTap({ chip_id, card_uid }: CardTapRequest): Promise<{ mode: CardTapMode; rental: unknown }> {
    const user = await databaseService.users.findOne({ nfc_card_uid: card_uid })
    if (!user) {
      console.log('[cardTap] No user bound to card', { card_uid })
      throw new ErrorWithStatus({
        message: 'User not found for the provided card.',
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    console.log('[cardTap] Matched user for card', { card_uid, user_id: user._id?.toString() })

    const bike = await databaseService.bikes.findOne({ chip_id })
    if (!bike) {
      console.log('[cardTap] Bike not found for chip', { chip_id })
      throw new ErrorWithStatus({
        message: `Bike with chip_id ${chip_id} not found or unavailable.`,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    console.log('[cardTap] Matched bike for chip', {
      chip_id,
      bike_id: bike._id?.toString(),
      status: bike.status,
      station_id: bike.station_id?.toString() ?? null
    })

    const activeRental = await databaseService.rentals.findOne({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId,
      status: RentalStatus.Rented
    })

    if (activeRental) {
      console.log('[cardTap] Detected active rental – ending session', {
        rental_id: activeRental._id?.toString(),
        user_id: user._id?.toString()
      })
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
      console.log('[cardTap] Found reservation for user/bike; activating', {
        reservation_id: reservation._id.toString(),
        user_id: user._id?.toString(),
        bike_id: bike._id?.toString()
      })
      await reservationFacade.activateReservation({ reservation_id: reservation._id })

      const startStationId = (bike.station_id ?? reservation.station_id) as ObjectId

      console.log('[cardTap] Creating rental from reservation', {
        user_id: user._id?.toString(),
        bike_id: bike._id?.toString(),
        start_station: startStationId.toString()
      })
      const rentalSession = await createRentalSessionForCard({
        user_id: user._id as ObjectId,
        start_station: startStationId,
        bike_id: bike._id as ObjectId
      })

      await reservationFacade.expireActiveForUserAndBike({ user_id: user._id as ObjectId, bike_id: bike._id as ObjectId })

      console.log('[cardTap] Rental created from reservation', {
        rental_id: (rentalSession as any)?._id?.toString?.(),
        mode: 'reservation_started'
      })
      return { mode: 'reservation_started', rental: rentalSession }
    }

    if (!bike.station_id) {
      console.log('[cardTap] Bike missing station when attempting fresh rental', { chip_id })
      throw new ErrorWithStatus({
        message: `Bike with chip_id ${chip_id} not found or unavailable.`,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (bike.status !== BikeStatus.Available) {
      console.log('[cardTap] Bike not available for rental', {
        chip_id,
        bike_id: bike._id?.toString(),
        status: bike.status
      })
      throw new ErrorWithStatus({
        message: 'Bike is not available for rental',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const startStationId = bike.station_id as ObjectId

    console.log('[cardTap] Creating rental without reservation', {
      user_id: user._id?.toString(),
      bike_id: bike._id?.toString(),
      start_station: startStationId.toString()
    })
    const rentalSession = await createRentalSessionForCard({
      user_id: user._id as ObjectId,
      start_station: startStationId,
      bike_id: bike._id as ObjectId
    })

    console.log('[cardTap] Rental created without reservation', {
      rental_id: (rentalSession as any)?._id?.toString?.(),
      mode: 'started'
    })
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
      console.warn('[cardTap] falling back to non-transactional rental creation', {
        user_id: params.user_id.toString(),
        bike_id: params.bike_id.toString()
      })
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
  } catch (error) {
    await databaseService.rentals.deleteOne({ _id: rental._id })
    throw error
  }

  return {
    ...(rental as any),
    total_price: 0
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
      console.warn('[cardTap] falling back to non-transactional rental ending', {
        rental_id: rental._id?.toString(),
        user_id: user_id.toString()
      })
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
  console.log('[cardTap] wallet state before charge', {
    wallet_id: walletBefore?._id?.toString() ?? null,
    balance: walletBefore ? Number.parseFloat(walletBefore.balance.toString()) : null
  })

  await walletService.paymentRental(user_id.toString(), decimalTotalPrice, description, rental_id)

  const walletAfter = await databaseService.wallets.findOne({ user_id })
  console.log('[cardTap] wallet state after charge', {
    wallet_id: walletAfter?._id?.toString() ?? null,
    balance: walletAfter ? Number.parseFloat(walletAfter.balance.toString()) : null
  })

  const latestTransaction = await databaseService.transactions.findOne(
    { rental_id },
    { sort: { created_at: -1 } }
  )
  console.log('[cardTap] latest transaction snapshot', {
    transaction_id: latestTransaction?._id?.toString() ?? null,
    amount: latestTransaction ? Number.parseFloat(latestTransaction.amount.toString()) : null,
    type: latestTransaction?.type ?? null
  })
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
