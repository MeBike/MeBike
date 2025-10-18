import type { Collection, Db } from "mongodb";

import { config } from "dotenv";
import { MongoClient } from "mongodb";
import process from "node:process";

import type Bike from "~/models/schemas/bike.schema";
import type Payment from "~/models/schemas/payment.schemas";
import type RefreshToken from "~/models/schemas/refresh-token.schemas";
import type Rental from "~/models/schemas/rental.schema";
import type Report from "~/models/schemas/report.schema";
import type Station from "~/models/schemas/station.schema";
import type Supplier from "~/models/schemas/supplier.schema";
import type Transaction from "~/models/schemas/transaction.schema";
import type User from "~/models/schemas/user.schema";
import type Wallet from "~/models/schemas/wallet.schemas";
import Refund from "~/models/schemas/refund.schema";
import Withdraw from "~/models/schemas/withdraw-request";
import RentalLog from "~/models/schemas/rental-audit-logs.schema";
import Reservation from "~/models/schemas/reservation.schema";

config();
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@mebike.8rtvndo.mongodb.net/?retryWrites=true&w=majority&appName=MeBike`;

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME);
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 });
      console.log("MeBike successfully connected to MongoDB!");
    }
    catch (error) {
      console.log(error);
      throw error;
    }
  }

  getClient(): MongoClient {
    return this.client;
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string);
  }

  async indexUsers() {
    await this.users.createIndex({ email: 1 }, { unique: true });
    await this.users.createIndex({ username: 1 }, { unique: true });
    // await this.users.createIndex({ phone_number: 1 }, { unique: true });
    await this.users.createIndex({ email: 1, password: 1 });
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string);
  }

  get stations(): Collection<Station> {
    return this.db.collection(process.env.DB_STATIONS_COLLECTION as string);
  }

  get reports(): Collection<Report> {
    return this.db.collection(process.env.DB_REPORTS_COLLECTION as string);
  }

  get bikes(): Collection<Bike> {
    return this.db.collection(process.env.DB_BIKES_COLLECTION as string);
  }

  async indexBikes() {
    await this.bikes.createIndex({ chip_id: 1 }, { unique: true });
    await this.bikes.createIndex({ station_id: 1 });
    await this.bikes.createIndex({ status: 1 });
  }

  get rentals(): Collection<Rental> {
    return this.db.collection(process.env.DB_RENTALS_COLLECTION as string);
  }

  get suppliers(): Collection<Supplier> {
    return this.db.collection(process.env.DB_SUPPLIERS_COLLECTION as string);
  }

  get rentalLogs(): Collection<RentalLog> {
    return this.db.collection(process.env.DB_RENTAL_LOGS_COLLECTION as string);
  }

  get reservations(): Collection<Reservation> {
    return this.db.collection(process.env.DB_RESERVATIONS_COLLECTION as string);
  }

  get payments(): Collection<Payment> {
    return this.db.collection(process.env.DB_PAYMENTS_COLLECTION as string);
  }

  get wallets(): Collection<Wallet> {
    return this.db.collection(process.env.DB_WALLETS_COLLECTION as string);
  }

  get transactions(): Collection<Transaction> {
    return this.db.collection(process.env.DB_TRANSACTIONS_COLLECTION as string);
  }

  get refunds(): Collection<Refund>{
    return this.db.collection(process.env.DB_REFUNDS_COLLECTION as string)
  }

  get withdraws(): Collection<Withdraw>{
    return this.db.collection(process.env.DB_WITHDRAWS_COLLECTION as string)
  }
}

const databaseService = new DatabaseService();
export default databaseService;
