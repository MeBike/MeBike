import { Decimal128, ObjectId } from 'mongodb'

import { BikeStatus, ReservationStatus, Role, UserVerifyStatus, WalletStatus } from '~/constants/enums'
import databaseService from '~/services/database.services'
import Bike from '~/models/schemas/bike.schema'
import Station from '~/models/schemas/station.schema'
import User from '~/models/schemas/user.schema'
import Reservation from '~/models/schemas/reservation.schema'
import Wallet from '~/models/schemas/wallet.schemas'
import { hashPassword } from '~/utils/crypto'

process.env.DB_WALLETS_COLLECTION = process.env.DB_WALLETS_COLLECTION ?? 'wallets'

const CARD_UIDS = ['3946298114', '31073280'] as const
const SHOULD_SEED_RESERVATION = true
const STATION_ID = new ObjectId('60d5f1b3e7b3c9a4b4f4b39f')
const BIKE_ID = new ObjectId('60d5f1b3e7b3c9a4b4f4b3a1')
const BIKE_CHIP_ID = 'C82E188DF058'
const USER_EMAILS = ['user1@test.com', 'user2@test.com'] as const

async function seedDatabase() {
  try {
    console.log('Connecting to database...')
    await databaseService.connect()

    console.log('Clearing old prototype data...')
    await databaseService.users.deleteMany({
      nfc_card_uid: { $in: CARD_UIDS }
    })
    await databaseService.users.deleteMany({
      email: { $in: USER_EMAILS }
    })
    await databaseService.bikes.deleteOne({ _id: BIKE_ID })
    await databaseService.bikes.deleteOne({ chip_id: BIKE_CHIP_ID })
    await databaseService.reservations.deleteMany({ bike_id: BIKE_ID })
    await databaseService.stations.deleteOne({ _id: STATION_ID })

    console.log('Creating prototype station...')
    const station = new Station({
      _id: STATION_ID,
      name: 'Prototype Station',
      address: '123 Test Street',
      latitude: 10.123,
      longitude: 106.456
    })
    await databaseService.stations.insertOne(station)

    console.log('Creating prototype users...')
    const user1 = new User({
      fullname: 'Test User One',
      email: 'user1@test.com',
      username: 'prototype_user_1',
      password: hashPassword('password123'),
      role: Role.User,
      verify: UserVerifyStatus.Verified,
      nfc_card_uid: CARD_UIDS[0]
    })

    const user2 = new User({
      fullname: 'Test User Two',
      email: 'user2@test.com',
      username: 'prototype_user_2',
      password: hashPassword('password123'),
      role: Role.User,
      verify: UserVerifyStatus.Verified,
      nfc_card_uid: CARD_UIDS[1]
    })

    await databaseService.users.insertMany([user1, user2])
    await databaseService.reservations.deleteMany({ user_id: { $in: [user1._id!, user2._id!] } })
    console.log('Users created successfully.')

    console.log('Creating prototype wallets...')
    await databaseService.wallets.deleteMany({ user_id: { $in: [user1._id!, user2._id!] } })
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

    console.log('Creating prototype bike...')
    const initialBikeStatus = SHOULD_SEED_RESERVATION ? BikeStatus.Reserved : BikeStatus.Available

    const bike = new Bike({
      _id: BIKE_ID,
      chip_id: BIKE_CHIP_ID,
      station_id: station._id,
      status: initialBikeStatus
    })
    await databaseService.bikes.insertOne(bike)
    console.log(`Bike created successfully with status ${initialBikeStatus}.`)

    console.log('Creating prototype reservation...')
    if (SHOULD_SEED_RESERVATION) {
      const reservation = new Reservation({
        user_id: user2._id!,
        bike_id: BIKE_ID,
        station_id: station._id!,
        start_time: new Date(),
        end_time: new Date(Date.now() + 30 * 60 * 1000),
        prepaid: Decimal128.fromString('0'),
        status: ReservationStatus.Pending
      })
      await databaseService.reservations.insertOne(reservation)
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
