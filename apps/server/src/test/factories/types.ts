import type { PrismaClient } from "generated/prisma/client";

export type FactoryContext = {
  prisma: PrismaClient;
};

export type UserOverrides = {
  id?: string;
  fullname?: string;
  email?: string;
  passwordHash?: string;
  phoneNumber?: string | null;
  username?: string | null;
  avatar?: string | null;
  location?: string | null;
  nfcCardUid?: string | null;
  role?: "USER" | "STAFF" | "TECHNICIAN" | "MANAGER" | "ADMIN" | "AGENCY";
  verify?: "UNVERIFIED" | "VERIFIED" | "BANNED";
};

export type StationOverrides = {
  id?: string;
  name?: string;
  address?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
};

export type BikeOverrides = {
  id?: string;
  chipId?: string;
  stationId?: string | null;
  supplierId?: string | null;
  status?: "AVAILABLE" | "BOOKED" | "BROKEN" | "RESERVED" | "MAINTAINED" | "UNAVAILABLE";
};

export type SupplierOverrides = {
  id?: string;
  name?: string;
  address?: string | null;
  phoneNumber?: string | null;
  contractFee?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "TERMINATED";
};

export type RentalOverrides = {
  id?: string;
  userId?: string;
  bikeId?: string | null;
  startStationId?: string;
  endStationId?: string | null;
  startTime?: Date;
  endTime?: Date | null;
  duration?: number | null;
  totalPrice?: string | null;
  subscriptionId?: string | null;
  status?: "RENTED" | "COMPLETED" | "CANCELLED" | "RESERVED";
};

export type ReservationOverrides = {
  id?: string;
  userId?: string;
  bikeId?: string | null;
  stationId?: string;
  reservationOption?: "ONE_TIME" | "FIXED_SLOT" | "SUBSCRIPTION";
  fixedSlotTemplateId?: string | null;
  subscriptionId?: string | null;
  startTime?: Date;
  endTime?: Date | null;
  prepaid?: string;
  status?: "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED";
};

export type SubscriptionOverrides = {
  id?: string;
  userId?: string;
  packageName?: "basic" | "premium" | "unlimited";
  maxUsages?: number | null;
  usageCount?: number;
  status?: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  activatedAt?: Date | null;
  expiresAt?: Date | null;
  price?: bigint;
};

export type TechnicianTeamOverrides = {
  id?: string;
  name?: string;
  stationId?: string;
  availabilityStatus?: "AVAILABLE" | "UNAVAILABLE";
};

export type UserOrgAssignmentOverrides = {
  id?: string;
  userId?: string;
  stationId?: string | null;
  agencyId?: string | null;
  technicianTeamId?: string | null;
};

export type PushTokenOverrides = {
  id?: string;
  userId?: string;
  token?: string;
  platform?: "ANDROID" | "IOS" | "UNKNOWN";
  deviceId?: string | null;
  appVersion?: string | null;
  isActive?: boolean;
  lastSeenAt?: Date;
};

export type WalletOverrides = {
  id?: string;
  userId?: string;
  balance?: bigint;
  reservedBalance?: bigint;
  status?: "ACTIVE" | "FROZEN";
};

export type CreatedUser = {
  id: string;
  email: string;
  role: string;
};

export type CreatedStation = {
  id: string;
  name: string;
};

export type CreatedBike = {
  id: string;
  chipId: string;
};

export type CreatedSupplier = {
  id: string;
  name: string;
};

export type CreatedRental = {
  id: string;
  userId: string;
};

export type CreatedReservation = {
  id: string;
  userId: string;
};

export type CreatedSubscription = {
  id: string;
  userId: string;
};

export type CreatedTechnicianTeam = {
  id: string;
  stationId: string;
};

export type CreatedUserOrgAssignment = {
  id: string;
  userId: string;
};

export type CreatedPushToken = {
  id: string;
  userId: string;
  token: string;
};

export type CreatedWallet = {
  id: string;
  userId: string;
};
