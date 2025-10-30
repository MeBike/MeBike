import { Decimal128, ObjectId } from 'mongodb'

import { BikeStatus, RentalStatus, ReservationStatus, Role, SupplierStatus, UserVerifyStatus, WalletStatus } from '~/constants/enums'
import databaseService from '~/services/database.services'
import { getLocalTime } from '~/utils/date-time'
import Bike from '~/models/schemas/bike.schema'
import Supplier from '~/models/schemas/supplier.schema'
import Station from '~/models/schemas/station.schema'
import User from '~/models/schemas/user.schema'
import Reservation from '~/models/schemas/reservation.schema'
import Rental from '~/models/schemas/rental.schema'
import Wallet from '~/models/schemas/wallet.schemas'
import { hashPassword } from '~/utils/crypto'

process.env.DB_WALLETS_COLLECTION = process.env.DB_WALLETS_COLLECTION ?? 'wallets'

const CARD_UIDS = ['3946298114', '31073280'] as const
const SHOULD_SEED_RESERVATION = true
const STATION_ID = new ObjectId('60d5f1b3e7b3c9a4b4f4b39f')
const BIKE_ID = new ObjectId('60d5f1b3e7b3c9a4b4f4b3a1')
const BIKE_CHIP_ID = 'C82E188DF058'
const USER_EMAILS = ['user1@test.com', 'user2@test.com'] as const
const SUPPLIER_ID = new ObjectId('60d5f1b3e7b3c9a4b4f4b3a2')

async function seedDatabase() {
  try {
    console.log('Connecting to database...')
    await databaseService.connect()

    console.log('Checking for existing prototype data...')
    const existingUsersCount = await databaseService.users.countDocuments({
      $or: [
        { nfc_card_uid: { $in: CARD_UIDS } },
        { email: { $in: USER_EMAILS } }
      ]
    })
    if (existingUsersCount > 0) {
      await databaseService.users.deleteMany({
        $or: [
          { nfc_card_uid: { $in: CARD_UIDS } },
          { email: { $in: USER_EMAILS } }
        ]
      })
      console.log(`Deleted ${existingUsersCount} existing users`)
    }

    const existingBikeCount = await databaseService.bikes.countDocuments({
      $or: [
        { _id: BIKE_ID },
        { chip_id: BIKE_CHIP_ID }
      ]
    })
    if (existingBikeCount > 0) {
      await databaseService.bikes.deleteMany({
        $or: [
          { _id: BIKE_ID },
          { chip_id: BIKE_CHIP_ID }
        ]
      })
      console.log(`Deleted ${existingBikeCount} existing bikes`)
    }

    const existingReservationsCount = await databaseService.reservations.countDocuments({ bike_id: BIKE_ID })
    if (existingReservationsCount > 0) {
      await databaseService.reservations.deleteMany({ bike_id: BIKE_ID })
      console.log(`Deleted ${existingReservationsCount} existing reservations`)
    }

    const existingRentalsCount = await databaseService.rentals.countDocuments({ bike_id: BIKE_ID })
    if (existingRentalsCount > 0) {
      await databaseService.rentals.deleteMany({ bike_id: BIKE_ID })
      console.log(`Deleted ${existingRentalsCount} existing rentals`)
    }

    const existingSupplierCount = await databaseService.suppliers.countDocuments({ name: 'Công ty TNHH YADEA Việt Nam' })
    if (existingSupplierCount > 0) {
      await databaseService.suppliers.deleteMany({ name: 'Công ty TNHH YADEA Việt Nam' })
      console.log(`Deleted ${existingSupplierCount} existing suppliers`)
    }

    console.log('Creating prototype supplier...')
    const supplier = new Supplier({
      _id: SUPPLIER_ID,
      name: 'Công ty TNHH YADEA Việt Nam',
      contact_info: {
        address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
        phone_number: '0987654321'
      },
      contract_fee: Decimal128.fromString('250000.50'),
      status: SupplierStatus.ACTIVE,
      created_at: new Date('2025-10-05T19:12:21.230Z')
    })
    await databaseService.suppliers.insertOne(supplier)

    console.log('Finding or creating prototype station...')
    // Try to find existing "Ga Bến Thành" station
    let station = await databaseService.stations.findOne({ name: 'Ga Bến Thành' })

    if (!station) {
      // Create prototype station if "Ga Bến Thành" doesn't exist
      station = new Station({
        _id: STATION_ID,
        name: 'Prototype Station',
        address: '123 Test Street',
        latitude: '10.123',
        longitude: '106.456',
        capacity: '10'
      })
      await databaseService.stations.insertOne(station)
      console.log('Created new prototype station')
    } else {
      console.log('Using existing "Ga Bến Thành" station')
    }

    console.log('Creating prototype users...')
    const user1 = new User({
      fullname: 'Test User One',
      email: 'user1@test.com',
      username: 'prototype_user_1',
      password: hashPassword('password123'),
      role: Role.User,
      verify: UserVerifyStatus.Verified,
      nfc_card_uid: CARD_UIDS[0],
      phone_number: '1234567890'
    })

    const user2 = new User({
      fullname: 'Test User Two',
      email: 'user2@test.com',
      username: 'prototype_user_2',
      password: hashPassword('password123'),
      role: Role.User,
      verify: UserVerifyStatus.Verified,
      nfc_card_uid: CARD_UIDS[1],
      phone_number: '0987654321'
    })

    await databaseService.users.insertMany([user1, user2])
    const existingUserReservationsCount = await databaseService.reservations.countDocuments({ user_id: { $in: [user1._id!, user2._id!] } })
    if (existingUserReservationsCount > 0) {
      await databaseService.reservations.deleteMany({ user_id: { $in: [user1._id!, user2._id!] } })
      console.log(`Deleted ${existingUserReservationsCount} existing user reservations`)
    }
    console.log('Users created successfully.')

    console.log('Creating prototype wallets...')
    const existingWalletsCount = await databaseService.wallets.countDocuments({ user_id: { $in: [user1._id!, user2._id!] } })
    if (existingWalletsCount > 0) {
      await databaseService.wallets.deleteMany({ user_id: { $in: [user1._id!, user2._id!] } })
      console.log(`Deleted ${existingWalletsCount} existing wallets`)
    }
    const wallets = [
      new Wallet({
        user_id: user1._id!,
        balance: Decimal128.fromString('200000'),
        status: WalletStatus.Active
      }),
      new Wallet({
        user_id: user2._id!,
        balance: Decimal128.fromString('200000'),
        status: WalletStatus.Active
      })
    ]
    await databaseService.wallets.insertMany(wallets)
    console.log('Wallets created successfully.')

    console.log('Cleaning up related prototype data...')
    const testUserIds = [user1._id!, user2._id!]
    const testRentalIds = [] 

    const existingTransactionsCount = await databaseService.transactions.countDocuments({
      wallet_id: { $in: testUserIds }
    })
    if (existingTransactionsCount > 0) {
      await databaseService.transactions.deleteMany({
        wallet_id: { $in: testUserIds }
      })
      console.log(`Deleted ${existingTransactionsCount} existing transactions`)
    }

    const existingPaymentsCount = await databaseService.payments.countDocuments({
      $or: [
        { user_id: { $in: testUserIds } }
      ]
    })
    if (existingPaymentsCount > 0) {
      await databaseService.payments.deleteMany({
        $or: [
          { user_id: { $in: testUserIds } }
        ]
      })
      console.log(`Deleted ${existingPaymentsCount} existing payments`)
    }

    const existingRefundsCount = await databaseService.refunds.countDocuments({
      user_id: { $in: testUserIds }
    })
    if (existingRefundsCount > 0) {
      await databaseService.refunds.deleteMany({
        user_id: { $in: testUserIds }
      })
      console.log(`Deleted ${existingRefundsCount} existing refunds`)
    }

    const existingRentalLogsCount = await databaseService.rentalLogs.countDocuments({
      user_id: { $in: testUserIds }
    })
    if (existingRentalLogsCount > 0) {
      await databaseService.rentalLogs.deleteMany({
        user_id: { $in: testUserIds }
      })
      console.log(`Deleted ${existingRentalLogsCount} existing rental logs`)
    }
    const existingRatingsCount = await databaseService.ratings.countDocuments({
      user_id: { $in: testUserIds }
    })
    if (existingRatingsCount > 0) {
      await databaseService.ratings.deleteMany({
        user_id: { $in: testUserIds }
      })
      console.log(`Deleted ${existingRatingsCount} existing ratings`)
    }

    console.log('Creating prototype bike...')
    const initialBikeStatus = SHOULD_SEED_RESERVATION ? BikeStatus.Reserved : BikeStatus.Available

    const bike = new Bike({
      _id: BIKE_ID,
      chip_id: BIKE_CHIP_ID,
      station_id: station._id,
      status: initialBikeStatus,
      supplier_id: supplier._id
    })
    await databaseService.bikes.insertOne(bike)
    console.log(`Bike created successfully with status ${initialBikeStatus}.`)

    console.log('Creating prototype reservation...')
    if (SHOULD_SEED_RESERVATION) {
      const reservation = new Reservation({
        user_id: user2._id!,
        bike_id: BIKE_ID,
        station_id: station._id!,
        start_time: getLocalTime(),
        end_time: new Date(getLocalTime().getTime() + 120 * 60 * 1000), // 2 hours from now
        prepaid: Decimal128.fromString('0'),
        status: ReservationStatus.Pending
      })
      await databaseService.reservations.insertOne(reservation)
      const reservedRental = new Rental({
        _id: reservation._id,
        user_id: reservation.user_id,
        bike_id: reservation.bike_id,
        start_station: reservation.station_id!,
        start_time: reservation.start_time,
        status: RentalStatus.Reserved
      })
      await databaseService.rentals.insertOne(reservedRental)
      console.log('Reservation created successfully.')
    }

    console.log('Database seeding complete!')
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await databaseService.getClient().close()
    console.log('Database connection closed.')
  }
}

void seedDatabase()
