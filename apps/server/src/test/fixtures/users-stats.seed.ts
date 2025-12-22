import type { Insertable } from "kysely";

import type { DB } from "../../../generated/prisma/types";

import {
  AuthEventType,
  RentalStatus,
  UserRole,
  UserVerifyStatus,
} from "../../../generated/prisma/types";

export const USER_VERIFIED_ID = "018d4529-6880-77a8-8e6f-4d2c88d22301";
export const USER_UNVERIFIED_ID = "018d4529-6880-77a8-8e6f-4d2c88d22302";
export const USER_BANNED_ID = "018d4529-6880-77a8-8e6f-4d2c88d22303";

type UserSeed = Insertable<DB["User"]>;

export const users: UserSeed[] = [
  {
    id: USER_VERIFIED_ID,
    fullname: "Verified User",
    email: "verified@example.com",
    password_hash: "hash123",
    phone_number: null,
    username: null,
    avatar: null,
    location: null,
    nfc_card_uid: null,
    role: UserRole.USER,
    verify: UserVerifyStatus.VERIFIED,
    created_at: new Date("2024-01-15T10:00:00Z"),
    updated_at: new Date("2024-01-15T10:00:00Z"),
  },
  {
    id: USER_UNVERIFIED_ID,
    fullname: "Unverified User",
    email: "unverified@example.com",
    password_hash: "hash123",
    phone_number: null,
    username: null,
    avatar: null,
    location: null,
    nfc_card_uid: null,
    role: UserRole.USER,
    verify: UserVerifyStatus.UNVERIFIED,
    created_at: new Date("2024-02-15T10:00:00Z"),
    updated_at: new Date("2024-02-15T10:00:00Z"),
  },
  {
    id: USER_BANNED_ID,
    fullname: "Banned User",
    email: "banned@example.com",
    password_hash: "hash123",
    phone_number: null,
    username: null,
    avatar: null,
    location: null,
    nfc_card_uid: null,
    role: UserRole.USER,
    verify: UserVerifyStatus.BANNED,
    created_at: new Date("2024-01-01T10:00:00Z"),
    updated_at: new Date("2024-01-01T10:00:00Z"),
  },
];

export const STATION_ID = "018d4529-6880-77a8-8e6f-4d2c88d22999";

export type StationSeed = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
  updatedAt: Date;
};

export const stations: StationSeed[] = [
  {
    id: STATION_ID,
    name: "Test Station",
    address: "123 Test St",
    capacity: 10,
    latitude: 10.0,
    longitude: 20.0,
    updatedAt: new Date("2024-01-01T10:00:00Z"),
  },
];

type RentalSeed = Insertable<DB["Rental"]>;

export const rentals: RentalSeed[] = [
  {
    id: "018d4529-6880-77a8-8e6f-4d2c88d22401",
    user_id: USER_VERIFIED_ID,
    status: RentalStatus.COMPLETED,
    duration: 60,
    total_price: "100000",
    start_station: STATION_ID,
    start_time: new Date("2024-01-20T10:00:00Z"),
    end_time: new Date("2024-01-20T11:00:00Z"),
    updated_at: new Date("2024-01-20T11:00:00Z"),
    bike_id: null,
    end_station: null,
    subscription_id: null,
  },
  {
    id: "018d4529-6880-77a8-8e6f-4d2c88d22402",
    user_id: USER_VERIFIED_ID,
    status: RentalStatus.COMPLETED,
    duration: 120,
    total_price: "200000",
    start_station: STATION_ID,
    start_time: new Date("2024-01-21T10:00:00Z"),
    end_time: new Date("2024-01-21T12:00:00Z"),
    updated_at: new Date("2024-01-21T12:00:00Z"),
    bike_id: null,
    end_station: null,
    subscription_id: null,
  },
];

type AuthEventSeed = Insertable<DB["AuthEvent"]>;

export const authEvents: AuthEventSeed[] = [
  {
    id: "018d4529-6880-77a8-8e6f-4d2c88d22501",
    user_id: USER_VERIFIED_ID,
    type: AuthEventType.SESSION_ISSUED,
    occurred_at: new Date("2024-01-20T09:00:00Z"),
  },
  {
    id: "018d4529-6880-77a8-8e6f-4d2c88d22502",
    user_id: USER_VERIFIED_ID,
    type: AuthEventType.SESSION_ISSUED,
    occurred_at: new Date("2024-01-21T09:00:00Z"),
  },
  {
    id: "018d4529-6880-77a8-8e6f-4d2c88d22503",
    user_id: USER_UNVERIFIED_ID,
    type: AuthEventType.SESSION_ISSUED,
    occurred_at: new Date("2024-02-15T09:00:00Z"),
  },
];
