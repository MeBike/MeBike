import type { Collection, Db } from 'mongodb'

import { config } from 'dotenv'
import { MongoClient } from 'mongodb'
import process from 'node:process'

import type Bike from '~/models/schemas/bike.schema'
import type Payment from '~/models/schemas/payment.schemas'
import type RefreshToken from '~/models/schemas/refresh-token.schemas'
import type Rental from '~/models/schemas/rental.schema'
import type Report from '~/models/schemas/report.schema'
import type Station from '~/models/schemas/station.schema'
import type Supplier from '~/models/schemas/supplier.schema'
import type Transaction from '~/models/schemas/transaction.schema'
import type User from '~/models/schemas/user.schema'
import type Wallet from '~/models/schemas/wallet.schemas'
import Refund from '~/models/schemas/refund.schema'
import Withdraw from '~/models/schemas/withdraw-request'
import RentalLog from '~/models/schemas/rental-audit-logs.schema'
import Reservation from '~/models/schemas/reservation.schema'
import Rating from '~/models/schemas/rating.schema'
import RatingReason from '~/models/schemas/rating-reason.schema'
import SosAlert from '~/models/schemas/sos-alert.schema'
import Subscription from '~/models/schemas/subscription.schema'
import FixedSlotTemplate from '~/models/schemas/fixed-slot.schema'

config()
// const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@mebike.8rtvndo.mongodb.net/?retryWrites=true&w=majority&appName=MeBike`;
const uri = process.env.DATABASE_URL!
class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('MeBike successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  getClient(): MongoClient {
    return this.client
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  async indexUsers() {
    await this.users.createIndex({ email: 1 }, { unique: true })
    await this.users.createIndex({ username: 1 }, { unique: true })
    await this.users.createIndex({ phone_number: 1 }, { unique: true })
    await this.users.createIndex({ email: 1, password: 1 })
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }

  get stations(): Collection<Station> {
    return this.db.collection(process.env.DB_STATIONS_COLLECTION as string)
  }

  async indexStations() {
    await this.stations.createIndex({ name: 1 }, { unique: true })
    await this.stations.createIndex({ location_geo: '2dsphere' })
  }

  get reports(): Collection<Report> {
    return this.db.collection(process.env.DB_REPORTS_COLLECTION as string)
  }

  get bikes(): Collection<Bike> {
    return this.db.collection(process.env.DB_BIKES_COLLECTION as string)
  }

  async indexBikes() {
    await this.bikes.createIndex({ chip_id: 1 }, { unique: true })
    await this.bikes.createIndex({ station_id: 1 })
    await this.bikes.createIndex({ status: 1 })
  }

  get rentals(): Collection<Rental> {
    return this.db.collection(process.env.DB_RENTALS_COLLECTION as string)
  }

  get suppliers(): Collection<Supplier> {
    return this.db.collection(process.env.DB_SUPPLIERS_COLLECTION as string)
  }

  async indexSuppliers() {
    await this.suppliers.createIndex({ name: 1 }, { unique: true })
  }

  get rentalLogs(): Collection<RentalLog> {
    return this.db.collection(process.env.DB_RENTAL_LOGS_COLLECTION as string)
  }

  get reservations(): Collection<Reservation> {
    return this.db.collection(process.env.DB_RESERVATIONS_COLLECTION as string)
  }

  get payments(): Collection<Payment> {
    return this.db.collection(process.env.DB_PAYMENTS_COLLECTION as string)
  }

  get wallets(): Collection<Wallet> {
    return this.db.collection(process.env.DB_WALLETS_COLLECTION as string)
  }

  get transactions(): Collection<Transaction> {
    return this.db.collection(process.env.DB_TRANSACTIONS_COLLECTION as string)
  }

  get refunds(): Collection<Refund> {
    return this.db.collection(process.env.DB_REFUNDS_COLLECTION as string)
  }

  get withdraws(): Collection<Withdraw> {
    return this.db.collection(process.env.DB_WITHDRAWS_COLLECTION as string)
  }

  get ratings(): Collection<Rating> {
    return this.db.collection(process.env.DB_RATING_COLLECTION as string)
  }

  get rating_reasons(): Collection<RatingReason> {
    return this.db.collection(process.env.DB_RATING_REASON_COLLECTION as string)
  }

  get sos_alerts(): Collection<SosAlert> {
    return this.db.collection(process.env.DB_SOS_ALERT_COLLECTION as string)
  }

  get subscriptions(): Collection<Subscription> {
    return this.db.collection(process.env.DB_SUBSCRIPTION_COLLECTION as string)
  }

  get fixedSlotTemplates(): Collection<FixedSlotTemplate> {
    return this.db.collection(process.env.DB_FIXED_SLOT_TEMPLATE_COLLECTION as string)
  }

  async indexReservation() {
    await databaseService.reservations.createIndex({ user_id: 1, created_at: -1 })
    await databaseService.reservations.createIndex({ bike_id: 1, start_time: 1, status: 1 })
    await databaseService.reservations.createIndex({ station_id: 1, start_time: 1 })
    await databaseService.reservations.createIndex({ fixed_slot_template_id: 1 })
    await databaseService.reservations.createIndex({ subscription_id: 1 })
    await databaseService.reservations.createIndex({ start_time: 1, status: 1 })
  }

  async indexSubscription() {
    await databaseService.subscriptions.createIndex({ user_id: 1, status: 1 })
    await databaseService.subscriptions.createIndex({ end_date: 1 })
    await databaseService.subscriptions.createIndex({ user_id: 1, end_date: 1 })
  }

  async indexFixedSlot() {
    await databaseService.fixedSlotTemplates.createIndex({ user_id: 1, status: 1 })
    await databaseService.fixedSlotTemplates.createIndex({ station_id: 1, status: 1 })
    await databaseService.fixedSlotTemplates.createIndex({ end_date: 1 })
    await databaseService.fixedSlotTemplates.createIndex({ user_id: 1, end_date: 1 })
  }
}

const databaseService = new DatabaseService()
export default databaseService
