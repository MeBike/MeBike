import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const AuthEventType = {
    SESSION_ISSUED: "SESSION_ISSUED"
} as const;
export type AuthEventType = (typeof AuthEventType)[keyof typeof AuthEventType];
export const BikeStatus = {
    AVAILABLE: "AVAILABLE",
    BOOKED: "BOOKED",
    BROKEN: "BROKEN",
    RESERVED: "RESERVED",
    MAINTAINED: "MAINTAINED",
    UNAVAILABLE: "UNAVAILABLE
} as const;
export type BikeStatus = (typeof BikeStatus)[keyof typeof BikeStatus];
export const FixedSlotStatus = {
    ACTIVE: "ACTIVE",
    CANCELLED: "CANCELLED"
} as const;
export type FixedSlotStatus = (typeof FixedSlotStatus)[keyof typeof FixedSlotStatus];
export const JobOutboxStatus = {
    PENDING: "PENDING",
    SENT: "SENT",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED"
} as const;
export type JobOutboxStatus = (typeof JobOutboxStatus)[keyof typeof JobOutboxStatus];
export const RatingReasonType = {
    ISSUE: "ISSUE",
    COMPLIMENT: "COMPLIMENT"
} as const;
export type RatingReasonType = (typeof RatingReasonType)[keyof typeof RatingReasonType];
export const AppliesToEnum = {
    bike: "bike",
    station: "station",
    app: "app"
} as const;
export type AppliesToEnum = (typeof AppliesToEnum)[keyof typeof AppliesToEnum];
export const RentalStatus = {
    RENTED: "RENTED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    RESERVED: "RESERVED"
} as const;
export type RentalStatus = (typeof RentalStatus)[keyof typeof RentalStatus];
export const ReservationStatus = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    CANCELLED: "CANCELLED",
    EXPIRED: "EXPIRED"
} as const;
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];
export const ReservationOption = {
    ONE_TIME: "ONE_TIME",
    FIXED_SLOT: "FIXED_SLOT",
    SUBSCRIPTION: "SUBSCRIPTION"
} as const;
export type ReservationOption = (typeof ReservationOption)[keyof typeof ReservationOption];
export const SubscriptionStatus = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    CANCELLED: "CANCELLED"
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export const SubscriptionPackage = {
    basic: "basic",
    premium: "premium",
    unlimited: "unlimited"
} as const;
export type SubscriptionPackage = (typeof SubscriptionPackage)[keyof typeof SubscriptionPackage];
export const SupplierStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    TERMINATED: "TERMINATED"
} as const;
export type SupplierStatus = (typeof SupplierStatus)[keyof typeof SupplierStatus];
export const UserRole = {
    USER: "USER",
    STAFF: "STAFF",
    ADMIN: "ADMIN",
    SOS: "SOS"
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const UserVerifyStatus = {
    UNVERIFIED: "UNVERIFIED",
    VERIFIED: "VERIFIED",
    BANNED: "BANNED"
} as const;
export type UserVerifyStatus = (typeof UserVerifyStatus)[keyof typeof UserVerifyStatus];
export const WalletStatus = {
    ACTIVE: "ACTIVE",
    FROZEN: "FROZEN"
} as const;
export type WalletStatus = (typeof WalletStatus)[keyof typeof WalletStatus];
export const WalletTransactionType = {
    DEPOSIT: "DEPOSIT",
    DEBIT: "DEBIT",
    REFUND: "REFUND",
    ADJUSTMENT: "ADJUSTMENT"
} as const;
export type WalletTransactionType = (typeof WalletTransactionType)[keyof typeof WalletTransactionType];
export const WalletTransactionStatus = {
    SUCCESS: "SUCCESS",
    PENDING: "PENDING",
    FAILED: "FAILED"
} as const;
export type WalletTransactionStatus = (typeof WalletTransactionStatus)[keyof typeof WalletTransactionStatus];
export type AuthEvent = {
    id: string;
    user_id: string;
    type: Generated<AuthEventType>;
    occurred_at: Generated<Timestamp>;
};
export type Bike = {
    id: string;
    chip_id: string;
    stationId: string | null;
    supplierId: string | null;
    status: BikeStatus;
    updated_at: Timestamp;
};
export type FixedSlotDate = {
    id: string;
    template_id: string;
    slot_date: Timestamp;
};
export type FixedSlotTemplate = {
    id: string;
    user_id: string;
    station_id: string;
    slot_start: Timestamp;
    status: Generated<FixedSlotStatus>;
    updated_at: Generated<Timestamp>;
};
export type JobOutbox = {
    id: string;
    type: string;
    dedupe_key: string | null;
    payload: unknown;
    run_at: Timestamp;
    status: Generated<JobOutboxStatus>;
    attempts: Generated<number>;
    locked_at: Timestamp | null;
    locked_by: string | null;
    last_error: string | null;
    sent_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};
export type Rating = {
    id: string;
    user_id: string;
    rental_id: string;
    rating: number;
    comment: string | null;
    updated_at: Generated<Timestamp>;
};
export type RatingReason = {
    id: string;
    type: RatingReasonType;
    applies_to: AppliesToEnum;
    messages: string;
};
export type RatingReasonLink = {
    rating_id: string;
    reason_id: string;
};
export type Rental = {
    id: string;
    user_id: string;
    bike_id: string | null;
    start_station: string;
    end_station: string | null;
    start_time: Generated<Timestamp>;
    end_time: Timestamp | null;
    duration: number | null;
    total_price: string | null;
    subscription_id: string | null;
    status: Generated<RentalStatus>;
    updated_at: Generated<Timestamp>;
};
export type Reservation = {
    id: string;
    user_id: string;
    bike_id: string | null;
    station_id: string;
    reservation_option: ReservationOption;
    fixed_slot_template_id: string | null;
    subscription_id: string | null;
    start_time: Timestamp;
    end_time: Timestamp | null;
    prepaid: Generated<string>;
    status: Generated<ReservationStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};
export type Station = {
    id: string;
    name: string;
    address: string;
    capacity: number;
    latitude: number;
    longitude: number;
    updated_at: Timestamp;
};
export type Subscription = {
    id: string;
    user_id: string;
    package_name: SubscriptionPackage;
    maxUsages: number | null;
    usage_count: Generated<number>;
    status: Generated<SubscriptionStatus>;
    activated_at: Timestamp | null;
    expires_at: Timestamp | null;
    price: string;
    updated_at: Generated<Timestamp>;
};
export type Supplier = {
    id: string;
    name: string;
    address: string | null;
    phone_number: string | null;
    contract_fee: string | null;
    status: SupplierStatus;
    updated_at: Timestamp;
};
export type User = {
    id: string;
    fullname: string;
    email: string;
    phone_number: string | null;
    username: string | null;
    password_hash: string;
    avatar: string | null;
    location: string | null;
    nfc_card_uid: string | null;
    role: Generated<UserRole>;
    verify: Generated<UserVerifyStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Wallet = {
    id: string;
    user_id: string;
    balance: Generated<string>;
    status: Generated<WalletStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type WalletTransaction = {
    id: string;
    wallet_id: string;
    amount: string;
    fee: Generated<string>;
    description: string | null;
    hash: string | null;
    type: WalletTransactionType;
    status: Generated<WalletTransactionStatus>;
    created_at: Generated<Timestamp>;
};
export type DB = {
    AuthEvent: AuthEvent;
    Bike: Bike;
    FixedSlotDate: FixedSlotDate;
    FixedSlotTemplate: FixedSlotTemplate;
    job_outbox: JobOutbox;
    Rating: Rating;
    RatingReason: RatingReason;
    RatingReasonLink: RatingReasonLink;
    Rental: Rental;
    Reservation: Reservation;
    Station: Station;
    Subscription: Subscription;
    Supplier: Supplier;
    User: User;
    wallet_transactions: WalletTransaction;
    wallets: Wallet;
};
