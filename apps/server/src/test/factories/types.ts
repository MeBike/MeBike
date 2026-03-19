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

export type CreatedRental = {
  id: string;
  userId: string;
};

export type CreatedWallet = {
  id: string;
  userId: string;
};
