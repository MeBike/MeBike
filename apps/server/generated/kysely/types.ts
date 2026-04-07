import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const AccountStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
    BANNED: "BANNED"
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
export const AgencyRequestStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED"
} as const;
export type AgencyRequestStatus = (typeof AgencyRequestStatus)[keyof typeof AgencyRequestStatus];
export const AuthEventType = {
    SESSION_ISSUED: "SESSION_ISSUED"
} as const;
export type AuthEventType = (typeof AuthEventType)[keyof typeof AuthEventType];
export const BikeSwapStatus = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED"
} as const;
export type BikeSwapStatus = (typeof BikeSwapStatus)[keyof typeof BikeSwapStatus];
export const BikeStatus = {
    AVAILABLE: "AVAILABLE",
    BOOKED: "BOOKED",
    BROKEN: "BROKEN",
    RESERVED: "RESERVED",
    MAINTAINED: "MAINTAINED",
    UNAVAILABLE: "UNAVAILABLE"
} as const;
export type BikeStatus = (typeof BikeStatus)[keyof typeof BikeStatus];
export const DiscountType = {
    PERCENTAGE: "PERCENTAGE",
    FIXED_AMOUNT: "FIXED_AMOUNT"
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];
export const CouponStatus = {
    ACTIVE: "ACTIVE",
    ASSIGNED: "ASSIGNED",
    LOCKED: "LOCKED",
    USED: "USED",
    EXPIRED: "EXPIRED",
    CANCELLED: "CANCELLED"
} as const;
export type CouponStatus = (typeof CouponStatus)[keyof typeof CouponStatus];
export const CouponTriggerType = {
    RIDING_DURATION: "RIDING_DURATION",
    USAGE_FREQUENCY: "USAGE_FREQUENCY",
    CAMPAIGN: "CAMPAIGN",
    MEMBERSHIP_MILESTONE: "MEMBERSHIP_MILESTONE",
    MANUAL_GRANT: "MANUAL_GRANT"
} as const;
export type CouponTriggerType = (typeof CouponTriggerType)[keyof typeof CouponTriggerType];
export const FixedSlotStatus = {
    ACTIVE: "ACTIVE",
    CANCELLED: "CANCELLED"
} as const;
export type FixedSlotStatus = (typeof FixedSlotStatus)[keyof typeof FixedSlotStatus];
export const IncidentSource = {
    DURING_RENTAL: "DURING_RENTAL",
    POST_RETURN: "POST_RETURN",
    STAFF_INSPECTION: "STAFF_INSPECTION"
} as const;
export type IncidentSource = (typeof IncidentSource)[keyof typeof IncidentSource];
export const IncidentStatus = {
    OPEN: "OPEN",
    ASSIGNED: "ASSIGNED",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
    CANCELLED: "CANCELLED"
} as const;
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];
export const IncidentSeverity = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL"
} as const;
export type IncidentSeverity = (typeof IncidentSeverity)[keyof typeof IncidentSeverity];
export const AssignmentStatus = {
    ASSIGNED: "ASSIGNED",
    ACCEPTED: "ACCEPTED",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CANCELLED: "CANCELLED"
} as const;
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];
export const MaintenanceResult = {
    REPAIRED_ON_SITE: "REPAIRED_ON_SITE",
    MOVED_TO_MAINTENANCE: "MOVED_TO_MAINTENANCE",
    NO_ISSUE_FOUND: "NO_ISSUE_FOUND",
    NOT_FOUND: "NOT_FOUND",
    IRREPARABLE: "IRREPARABLE"
} as const;
export type MaintenanceResult = (typeof MaintenanceResult)[keyof typeof MaintenanceResult];
export const JobOutboxStatus = {
    PENDING: "PENDING",
    SENT: "SENT",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED"
} as const;
export type JobOutboxStatus = (typeof JobOutboxStatus)[keyof typeof JobOutboxStatus];
export const PaymentProvider = {
    STRIPE: "STRIPE"
} as const;
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];
export const PaymentKind = {
    TOPUP: "TOPUP",
    WITHDRAW: "WITHDRAW"
} as const;
export type PaymentKind = (typeof PaymentKind)[keyof typeof PaymentKind];
export const PaymentStatus = {
    PENDING: "PENDING",
    SUCCEEDED: "SUCCEEDED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED"
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PaymentMethod = {
    WALLET: "WALLET",
    STRIPE: "STRIPE",
    INTERNAL_ADJUSTMENT: "INTERNAL_ADJUSTMENT"
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export const PaymentRecordStatus = {
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
    PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED"
} as const;
export type PaymentRecordStatus = (typeof PaymentRecordStatus)[keyof typeof PaymentRecordStatus];
export const PushTokenPlatform = {
    ANDROID: "ANDROID",
    IOS: "IOS",
    UNKNOWN: "UNKNOWN"
} as const;
export type PushTokenPlatform = (typeof PushTokenPlatform)[keyof typeof PushTokenPlatform];
export const RatingReasonType = {
    ISSUE: "ISSUE",
    COMPLIMENT: "COMPLIMENT"
} as const;
export type RatingReasonType = (typeof RatingReasonType)[keyof typeof RatingReasonType];
export const AppliesToEnum = {
    bike: "bike",
    station: "station"
} as const;
export type AppliesToEnum = (typeof AppliesToEnum)[keyof typeof AppliesToEnum];
export const RedistributionStatus = {
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    IN_TRANSIT: "IN_TRANSIT",
    PARTIALLY_COMPLETED: "PARTIALLY_COMPLETED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED"
} as const;
export type RedistributionStatus = (typeof RedistributionStatus)[keyof typeof RedistributionStatus];
export const ConfirmationMethod = {
    QR_CODE: "QR_CODE",
    MANUAL: "MANUAL"
} as const;
export type ConfirmationMethod = (typeof ConfirmationMethod)[keyof typeof ConfirmationMethod];
export const HandoverStatus = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    UNDER_STATION_CARE: "UNDER_STATION_CARE",
    UNDER_AGENCY_CARE: "UNDER_AGENCY_CARE",
    DISPUTED: "DISPUTED"
} as const;
export type HandoverStatus = (typeof HandoverStatus)[keyof typeof HandoverStatus];
export const RentalPenaltyType = {
    LATE_RETURN: "LATE_RETURN",
    LOSS: "LOSS",
    DAMAGE: "DAMAGE",
    OTHER: "OTHER"
} as const;
export type RentalPenaltyType = (typeof RentalPenaltyType)[keyof typeof RentalPenaltyType];
export const RentalStatus = {
    RENTED: "RENTED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED"
} as const;
export type RentalStatus = (typeof RentalStatus)[keyof typeof RentalStatus];
export const ReservationStatus = {
    PENDING: "PENDING",
    FULFILLED: "FULFILLED",
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
export const ReturnSlotStatus = {
    ACTIVE: "ACTIVE",
    USED: "USED",
    CANCELLED: "CANCELLED"
} as const;
export type ReturnSlotStatus = (typeof ReturnSlotStatus)[keyof typeof ReturnSlotStatus];
export const StationType = {
    INTERNAL: "INTERNAL",
    AGENCY: "AGENCY"
} as const;
export type StationType = (typeof StationType)[keyof typeof StationType];
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
export const TechnicianTeamAvailability = {
    AVAILABLE: "AVAILABLE",
    UNAVAILABLE: "UNAVAILABLE"
} as const;
export type TechnicianTeamAvailability = (typeof TechnicianTeamAvailability)[keyof typeof TechnicianTeamAvailability];
export const UserRole = {
    USER: "USER",
    STAFF: "STAFF",
    TECHNICIAN: "TECHNICIAN",
    MANAGER: "MANAGER",
    ADMIN: "ADMIN",
    AGENCY: "AGENCY"
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const UserVerifyStatus = {
    UNVERIFIED: "UNVERIFIED",
    VERIFIED: "VERIFIED"
} as const;
export type UserVerifyStatus = (typeof UserVerifyStatus)[keyof typeof UserVerifyStatus];
export const WalletHoldStatus = {
    ACTIVE: "ACTIVE",
    RELEASED: "RELEASED",
    SETTLED: "SETTLED"
} as const;
export type WalletHoldStatus = (typeof WalletHoldStatus)[keyof typeof WalletHoldStatus];
export const WalletHoldReason = {
    WITHDRAWAL: "WITHDRAWAL",
    RENTAL_DEPOSIT: "RENTAL_DEPOSIT"
} as const;
export type WalletHoldReason = (typeof WalletHoldReason)[keyof typeof WalletHoldReason];
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
export const WalletWithdrawalStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    SUCCEEDED: "SUCCEEDED",
    FAILED: "FAILED"
} as const;
export type WalletWithdrawalStatus = (typeof WalletWithdrawalStatus)[keyof typeof WalletWithdrawalStatus];
export type Agency = {
    id: string;
    name: string;
    contact_phone: string | null;
    status: Generated<AccountStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AgencyRequest = {
    id: string;
    requester_user_id: string | null;
    requester_email: string;
    requester_phone: string | null;
    agency_name: string;
    agency_address: string | null;
    agency_contact_phone: string | null;
    status: Generated<AgencyRequestStatus>;
    description: string | null;
    reviewed_by_user_id: string | null;
    reviewed_at: Timestamp | null;
    approved_agency_id: string | null;
    created_agency_user_id: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
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
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type BikeMaintenanceLog = {
    id: string;
    bike_id: string;
    incident_report_id: string | null;
    technician_user_id: string | null;
    result: MaintenanceResult;
    notes: string | null;
    created_at: Generated<Timestamp>;
};
export type BikeSwapRequest = {
    id: string;
    rental_id: string;
    user_id: string;
    old_bike_id: string;
    new_bike_id: string | null;
    station_id: string | null;
    reason: string | null;
    status: Generated<BikeSwapStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Coupon = {
    id: string;
    coupon_rule_id: string | null;
    code: string;
    discount_type: DiscountType;
    discount_value: string;
    expires_at: Timestamp | null;
    status: Generated<CouponStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type CouponRule = {
    id: string;
    name: string;
    trigger_type: CouponTriggerType;
    min_riding_minutes: number | null;
    min_completed_rentals: number | null;
    discount_type: DiscountType;
    discount_value: string;
    status: Generated<AccountStatus>;
    priority: Generated<number>;
    active_from: Timestamp | null;
    active_to: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type EnvironmentalImpactPolicy = {
    id: string;
    name: string;
    average_speed_kmh: string;
    co2_saved_per_km: string;
    status: Generated<AccountStatus>;
    active_from: Timestamp | null;
    active_to: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type EnvironmentalImpactStat = {
    id: string;
    user_id: string;
    rental_id: string;
    policy_id: string;
    estimated_distance_km: string | null;
    co2_saved: string;
    policy_snapshot: unknown;
    calculated_at: Generated<Timestamp>;
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
export type GeoBoundary = {
    code: string;
};
export type IncidentAttachment = {
    id: string;
    incident_report_id: string;
    file_url: string;
    created_at: Generated<Timestamp>;
};
export type IncidentReport = {
    id: string;
    reporter_user_id: string;
    rental_id: string | null;
    bike_id: string;
    station_id: string | null;
    source: IncidentSource;
    incident_type: string;
    severity: IncidentSeverity;
    description: string | null;
    latitude: string | null;
    longitude: string | null;
    bike_locked: Generated<boolean>;
    status: Generated<IncidentStatus>;
    reported_at: Generated<Timestamp>;
    resolved_at: Timestamp | null;
    closed_at: Timestamp | null;
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
export type Payment = {
    id: string;
    user_id: string;
    wallet_id: string | null;
    rental_id: string | null;
    reservation_id: string | null;
    amount: string;
    method: PaymentMethod;
    status: Generated<PaymentRecordStatus>;
    paid_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type PaymentAttempt = {
    id: string;
    user_id: string;
    wallet_id: string;
    provider: PaymentProvider;
    provider_ref: string | null;
    kind: PaymentKind;
    status: Generated<PaymentStatus>;
    amount_minor: string;
    fee_minor: Generated<string>;
    currency: string;
    failure_reason: string | null;
    metadata: unknown | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type PricingPolicy = {
    id: string;
    name: string;
    base_rate: string;
    billing_unit_minutes: number;
    overtime_rate: string | null;
    reservation_fee: Generated<string>;
    deposit_required: Generated<string>;
    late_return_cutoff: Generated<Timestamp>;
    status: Generated<AccountStatus>;
    active_from: Timestamp | null;
    active_to: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type PushToken = {
    id: string;
    user_id: string;
    token: string;
    platform: Generated<PushTokenPlatform>;
    device_id: string | null;
    app_version: string | null;
    is_active: Generated<boolean>;
    last_seen_at: Generated<Timestamp>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Rating = {
    id: string;
    user_id: string;
    rental_id: string;
    bike_id: string | null;
    station_id: string | null;
    bike_score: number;
    station_score: number;
    comment: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
    edited_at: Timestamp | null;
};
export type RatingReason = {
    id: string;
    type: RatingReasonType;
    applies_to: AppliesToEnum;
    message: string;
    is_default: Generated<boolean>;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type RatingReasonLink = {
    rating_id: string;
    reason_id: string;
    target: AppliesToEnum;
};
export type RedistributionRequest = {
    id: string;
    requested_by_user_id: string;
    approved_by_user_id: string | null;
    source_station_id: string;
    target_station_id: string | null;
    reason: string | null;
    status: Generated<RedistributionStatus>;
    started_at: Timestamp | null;
    completed_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type RedistributionRequestItem = {
    id: string;
    redistribution_request_id: string;
    bike_id: string | null;
    requested_quantity: number | null;
    delivered_at: Timestamp | null;
    created_at: Generated<Timestamp>;
};
export type Rental = {
    id: string;
    user_id: string;
    reservation_id: string | null;
    bike_id: string;
    deposit_hold_id: string | null;
    pricing_policy_id: string | null;
    start_station: string;
    end_station: string | null;
    created_at: Generated<Timestamp>;
    start_time: Generated<Timestamp>;
    end_time: Timestamp | null;
    duration: number | null;
    total_price: string | null;
    subscription_id: string | null;
    status: Generated<RentalStatus>;
    updated_at: Generated<Timestamp>;
};
export type RentalBillingRecord = {
    id: string;
    rental_id: string;
    pricing_policy_id: string;
    total_duration_minutes: number;
    estimated_distance_km: string | null;
    base_amount: Generated<string>;
    overtime_amount: Generated<string>;
    coupon_discount_amount: Generated<string>;
    subscription_discount_amount: Generated<string>;
    deposit_forfeited: Generated<boolean>;
    total_amount: string;
    created_at: Generated<Timestamp>;
};
export type RentalPenalty = {
    id: string;
    rental_id: string;
    wallet_hold_id: string | null;
    penalty_type: RentalPenaltyType;
    amount: string;
    description: string | null;
    created_at: Generated<Timestamp>;
};
export type Reservation = {
    id: string;
    user_id: string;
    bike_id: string | null;
    station_id: string;
    pricing_policy_id: string | null;
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
export type ReturnConfirmation = {
    id: string;
    rental_id: string;
    station_id: string | null;
    confirmed_by_user_id: string;
    confirmation_method: Generated<ConfirmationMethod>;
    handover_status: Generated<HandoverStatus>;
    confirmed_at: Timestamp;
    created_at: Generated<Timestamp>;
};
export type ReturnSlotReservation = {
    id: string;
    rental_id: string;
    user_id: string;
    station_id: string;
    reserved_from: Timestamp;
    status: Generated<ReturnSlotStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Station = {
    id: string;
    name: string;
    address: string;
    station_type: Generated<StationType>;
    agency_id: string | null;
    total_capacity: number;
    pickup_slot_limit: Generated<number>;
    return_slot_limit: Generated<number>;
    latitude: number;
    longitude: number;
    created_at: Generated<Timestamp>;
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
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};
export type Supplier = {
    id: string;
    name: string;
    address: string | null;
    phone_number: string | null;
    contract_fee: string | null;
    status: SupplierStatus;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type TechnicianAssignment = {
    id: string;
    incident_report_id: string;
    technician_team_id: string | null;
    technician_user_id: string | null;
    assigned_by_user_id: string | null;
    distance_meters: number | null;
    duration_seconds: number | null;
    route_geometry: string | null;
    assigned_at: Generated<Timestamp>;
    accepted_at: Timestamp | null;
    started_at: Timestamp | null;
    resolved_at: Timestamp | null;
    status: Generated<AssignmentStatus>;
};
export type TechnicianTeam = {
    id: string;
    name: string;
    station_id: string;
    availability_status: Generated<TechnicianTeamAvailability>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type User = {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    username: string | null;
    password_hash: string;
    avatar_url: string | null;
    location_text: string | null;
    nfc_card_uid: string | null;
    role: Generated<UserRole>;
    account_status: Generated<AccountStatus>;
    verify_status: Generated<UserVerifyStatus>;
    stripe_connected_account_id: string | null;
    stripe_payouts_enabled: boolean | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type UserCoupon = {
    id: string;
    user_id: string;
    coupon_id: string;
    assigned_at: Generated<Timestamp>;
    used_at: Timestamp | null;
    locked_at: Timestamp | null;
    lock_expires_at: Timestamp | null;
    locked_for_payment_id: string | null;
    status: Generated<CouponStatus>;
};
export type UserOrgAssignment = {
    id: string;
    user_id: string;
    station_id: string | null;
    agency_id: string | null;
    technician_team_id: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Wallet = {
    id: string;
    user_id: string;
    balance: Generated<string>;
    reserved_balance: Generated<string>;
    status: Generated<WalletStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type WalletHold = {
    id: string;
    wallet_id: string;
    withdrawal_id: string | null;
    rental_id: string | null;
    amount: string;
    status: Generated<WalletHoldStatus>;
    reason: Generated<WalletHoldReason>;
    released_at: Timestamp | null;
    settled_at: Timestamp | null;
    forfeited_at: Timestamp | null;
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
export type WalletWithdrawal = {
    id: string;
    user_id: string;
    wallet_id: string;
    amount: string;
    currency: string;
    payout_amount: string | null;
    payout_currency: string | null;
    fx_rate: string | null;
    fx_quoted_at: Timestamp | null;
    status: Generated<WalletWithdrawalStatus>;
    idempotency_key: string;
    stripe_transfer_id: string | null;
    stripe_payout_id: string | null;
    failure_reason: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type DB = {
    Agency: Agency;
    AgencyRequest: AgencyRequest;
    AuthEvent: AuthEvent;
    Bike: Bike;
    bike_maintenance_logs: BikeMaintenanceLog;
    BikeSwapRequest: BikeSwapRequest;
    coupon_rules: CouponRule;
    coupons: Coupon;
    environmental_impact_policies: EnvironmentalImpactPolicy;
    environmental_impact_stats: EnvironmentalImpactStat;
    FixedSlotDate: FixedSlotDate;
    FixedSlotTemplate: FixedSlotTemplate;
    GeoBoundary: GeoBoundary;
    incident_attachments: IncidentAttachment;
    incident_reports: IncidentReport;
    job_outbox: JobOutbox;
    payment_attempts: PaymentAttempt;
    payments: Payment;
    pricing_policies: PricingPolicy;
    push_tokens: PushToken;
    rating_reason_links: RatingReasonLink;
    rating_reasons: RatingReason;
    ratings: Rating;
    redistribution_request_items: RedistributionRequestItem;
    redistribution_requests: RedistributionRequest;
    Rental: Rental;
    rental_billing_records: RentalBillingRecord;
    rental_penalties: RentalPenalty;
    Reservation: Reservation;
    return_confirmations: ReturnConfirmation;
    return_slot_reservations: ReturnSlotReservation;
    Station: Station;
    Subscription: Subscription;
    Supplier: Supplier;
    technician_assignments: TechnicianAssignment;
    TechnicianTeam: TechnicianTeam;
    user_coupons: UserCoupon;
    UserOrgAssignment: UserOrgAssignment;
    users: User;
    wallet_holds: WalletHold;
    wallet_transactions: WalletTransaction;
    wallet_withdrawals: WalletWithdrawal;
    wallets: Wallet;
};
