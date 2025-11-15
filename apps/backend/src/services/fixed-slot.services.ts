import { ClientSession, Decimal128, ObjectId } from 'mongodb'
import {
  FixedSlotStatus,
  RentalStatus,
  ReservationOptions,
  ReservationStatus,
  SubscriptionStatus
} from '~/constants/enums'
import FixedSlotTemplate from '~/models/schemas/fixed-slot.schema'
import databaseService from './database.services'
import { generateDateTimeWithTimeAndDate, getLocalTime } from '~/utils/date-time'
import Reservation from '~/models/schemas/reservation.schema'
import reservationsService from './reservations.services'
import { ErrorWithStatus } from '~/models/errors'
import { RESERVATIONS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import walletService from './wallets.services'
import { uniqueDates } from '~/utils/validation'
import Rental from '~/models/schemas/rental.schema'

interface CreateFixedSlotTemplateParams {
  user_id: ObjectId
  station_id: ObjectId
  slot_start: string
  selected_dates: string[]
}

class FixedSlotTemplateService {
  async create(params: CreateFixedSlotTemplateParams) {
    const { user_id, station_id, slot_start, selected_dates } = params
    const templateId = new ObjectId()

    const template = new FixedSlotTemplate({
      _id: templateId,
      user_id,
      station_id,
      slot_start,
      selected_dates
    })

    let result: any = {}
    const session = databaseService.getClient().startSession()
    try {
      await session.withTransaction(async () => {
        await databaseService.fixedSlotTemplates.insertOne(template, { session })

        result = await this.generateAndInsertReservations({
          user_id,
          station_id,
          slot_start,
          selected_dates,
          template,
          session
        })
      })

      return {
        template,
        ...result
      }
    } finally {
      await session.endSession()
    }
  }

  async generateAndInsertReservations({
    user_id,
    station_id,
    slot_start,
    selected_dates,
    template,
    session
  }: {
    user_id: ObjectId
    station_id: ObjectId
    slot_start: string
    selected_dates: string[]
    template: FixedSlotTemplate
    session?: ClientSession
  }) {
    const templateId = template._id as ObjectId
    const prepaid = Decimal128.fromString(process.env.PREPAID_VALUE ?? '2000')
    const sub = await databaseService.subscriptions.findOne({
      user_id,
      status: { $in: [SubscriptionStatus.PENDING, SubscriptionStatus.ACTIVE] }
    })

    let remainingUsages = 0
    let unlimited = false

    if (sub) {
      if (sub.max_usages == null) {
        unlimited = true
      } else {
        remainingUsages = sub.max_usages - sub.usage_count
      }
    }

    const totalReservation = selected_dates.length
    const useSubscription = sub && (unlimited || remainingUsages >= totalReservation)

    const reservations = selected_dates.map((date) => {
      return new Reservation({
        _id: new ObjectId(),
        user_id,
        station_id,
        start_time: generateDateTimeWithTimeAndDate(slot_start, date),
        prepaid: useSubscription ? Decimal128.fromString('0') : prepaid,
        reservation_option: ReservationOptions.FIXED_SLOT,
        fixed_slot_template_id: templateId,
        subscription_id: useSubscription ? sub._id : undefined
      })
    })

    const rentals = reservations.map((r) => {
      return new Rental({
        _id: r._id,
        user_id,
        start_station: r.station_id,
        start_time: r.start_time,
        status: RentalStatus.Reserved,
        subscription_id: useSubscription ? sub._id : undefined
      })
    })

    let totalPrepaid = 0
    if (!useSubscription) {
      totalPrepaid = reservations.reduce((sum, r) => sum + Number(r.prepaid.toString()), 0)

      const enoughToPay = reservationsService.isEnoughBalanceToPay(totalPrepaid, user_id)
      if (!enoughToPay) {
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.NOT_ENOUGH_BALANCE_TO_PAY.replace('%s', totalPrepaid.toString()),
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    await Promise.all([
      databaseService.reservations.insertMany(reservations, { session }),
      databaseService.rentals.insertMany(rentals, { session })
    ])

    if (useSubscription) {
      await databaseService.subscriptions.updateOne(
        { _id: sub._id },
        { $inc: { usage_count: totalReservation }, $set: { updated_at: getLocalTime() } },
        { session }
      )
    }

    if (totalPrepaid > 0) {
      const reservationIds = reservations.map((r) => r._id) as ObjectId[]
      await walletService.paymentFixedSlotReservations(
        user_id.toString(),
        prepaid,
        RESERVATIONS_MESSAGE.FIXED_SLOT_PAYMENT_DESCRIPTION.replace('%s', templateId.toString()),
        reservationIds,
        true
      )
    }

    return { reservations, useSubscription, totalPrepaid }
  }

  async getDetail(template: FixedSlotTemplate) {
    const [user, station] = await Promise.all([
      databaseService.users.findOne({ _id: template.user_id }),
      databaseService.stations.findOne({ _id: template.station_id })
    ])

    return {
      ...template,
      user: { fullname: user?.fullname, email: user?.email },
      station_name: station?.name
    }
  }

  getListPipeline(match: any) {
    return [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'stations',
          localField: 'station_id',
          foreignField: '_id',
          as: 'station'
        }
      },
      { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          station_name: '$station.name',
          slot_start: 1,
          selected_dates: 1,
          status: 1,
          created_at: 1,
          user: { fullname: 1, email: 1 }
        }
      }
    ]
  }

  async update(template: FixedSlotTemplate, updates: Partial<FixedSlotTemplate>) {
    const templateId = template._id as ObjectId
    const now = getLocalTime()
    const today = getLocalTime()
    today.setUTCHours(0, 0, 0, 0)
    const currentDate = template.selected_dates.filter((d) => new Date(d) > today)
    const newDates = updates.selected_dates || []

    const uniqueNewDates = uniqueDates(newDates)

    const datesToAdd = uniqueNewDates.filter((d) => !currentDate.includes(d))
    const datesToUpdate = uniqueNewDates.filter((d) => currentDate.includes(d))
    const datesToRemove = currentDate.filter((d) => !uniqueNewDates.includes(d))

    const updatedDates = [...currentDate.filter((d) => !datesToRemove.includes(d)), ...datesToAdd]
    updatedDates.sort()

    const updatedData: any = {
      selected_dates: updatedDates,
      updated_at: now
    }

    const updateSlotStart = updates.slot_start || template.slot_start
    const session = databaseService.getClient().startSession()
    try {
      await session.withTransaction(async () => {
        if (datesToAdd.length > 0) {
          await this.generateAndInsertReservations({
            user_id: template.user_id,
            station_id: template.station_id,
            slot_start: updateSlotStart,
            selected_dates: datesToAdd,
            template,
            session
          })
        }

        if (datesToUpdate.length > 0 && updates.slot_start && updates.slot_start !== template.slot_start) {
          const updateSlotStart = updates.slot_start

          await Promise.all(
            datesToUpdate.map(async (date) => {
              const newStartTime = generateDateTimeWithTimeAndDate(updateSlotStart, date)
              const reservationsOfDate = await databaseService.reservations
                .find({
                  fixed_slot_template_id: templateId,
                  start_time: {
                    $gte: new Date(date + 'T00:00:00.000Z'),
                    $lt: new Date(date + 'T23:59:59.999Z')
                  }
                })
                .toArray()

              const reservationIds = reservationsOfDate.map((r) => r._id)

              // Update reservation start_time
              await databaseService.reservations.updateMany(
                { _id: { $in: reservationIds } },
                { $set: { start_time: newStartTime, updated_at: now } },
                { session }
              )

              // Update corresponding rentals
              await databaseService.rentals.updateMany(
                { _id: { $in: reservationIds } },
                { $set: { start_time: newStartTime, updated_at: now } },
                { session }
              )

              updatedData.slot_start = updateSlotStart
            })
          )
        }

        if (datesToRemove.length > 0) {
          const startTimes = datesToRemove.map((d) => generateDateTimeWithTimeAndDate(template.slot_start, d))
          const reservationsToCancel = await databaseService.reservations
            .find({
              fixed_slot_template_id: templateId,
              start_time: { $in: startTimes },
              status: ReservationStatus.Pending
            })
            .toArray()

          const reservationIdsToCancel = reservationsToCancel.map((r) => r._id)

          await this.processCancel(reservationIdsToCancel, session)
        }
      })

      const updatedTemplate = await databaseService.fixedSlotTemplates.findOneAndUpdate(
        { _id: templateId },
        { $set: updatedData },
        { returnDocument: 'after' }
      )

      return {
        ...updatedTemplate,
        addedDates: datesToAdd,
        updatedDates: datesToUpdate,
        removedDates: datesToRemove
      }
    } catch (err) {
      throw err
    } finally {
      await session.endSession()
    }
  }

  async updateStatus(template_id: ObjectId, status: FixedSlotStatus) {
    const now = getLocalTime()
    const result = await databaseService.fixedSlotTemplates.findOneAndUpdate(
      { _id: template_id },
      { $set: { status, updated_at: now } },
      { returnDocument: 'after' }
    )
    return result
  }

  async updateCorrespondingRentalAndReservation(template_id: ObjectId) {
    const reservations = await databaseService.reservations.find({ fixed_slot_template_id: template_id }).toArray()
    const reservationIds = reservations.map((r) => r._id)
    const session = databaseService.getClient().startSession()
    try {
      await session.withTransaction(async()=>{
        await this.processCancel(reservationIds, session)
      })
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async processCancel(reservationIds: ObjectId[], session?: ClientSession) {
    const now = getLocalTime()
    await Promise.all([
      // Mark cancelled reservations
      databaseService.reservations.updateMany(
        { _id: { $in: reservationIds } },
        {
          $set: {
            status: ReservationStatus.Cancelled,
            updated_at: now
          }
        },
        { session }
      ),

      // Mark cancelled corresponding rentals
      databaseService.rentals.updateMany(
        { _id: { $in: reservationIds } },
        {
          $set: {
            status: RentalStatus.Cancelled,
            updated_at: now
          }
        },
        { session }
      )
    ])
  }

  // Lấy tất cả template ACTIVE
  async getActiveTemplatesWithDetails() {
    const pipeline = [
      { $match: { status: FixedSlotStatus.ACTIVE } },
      {
        $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' }
      },
      { $unwind: '$user' },
      {
        $lookup: { from: 'stations', localField: 'station_id', foreignField: '_id', as: 'station' }
      },
      { $unwind: '$station' },
      {
        $project: {
          _id: 1,
          user_id: 1,
          station_id: 1,
          slot_start: 1,
          selected_dates: 1,
          'user.fullname': 1,
          'user.email': 1,
          'station.name': 1
        }
      }
    ]

    return await databaseService.fixedSlotTemplates.aggregate(pipeline).toArray()
  }

  // Lấy xe đã đặt trong ngày tại các trạm
  async getReservedBikeMapByStations(stationIds: string[], date: Date) {
    const startOfDay = new Date(date)
    const endOfDay = new Date(date)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const reservations = await databaseService.reservations
      .find({
        station_id: { $in: stationIds.map((id) => new ObjectId(id)) },
        start_time: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: [ReservationStatus.Pending, ReservationStatus.Active] }
      })
      .toArray()

    const map = new Map<string, ObjectId[]>()

    for (const res of reservations) {
      const stationKey = res.station_id.toString()
      if (!map.has(stationKey)) map.set(stationKey, [])
      map.get(stationKey)!.push(res.bike_id!)
    }

    return map
  }
}

export const fixedSlotTemplateService = new FixedSlotTemplateService()
