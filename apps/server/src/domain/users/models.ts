import type { Prisma as PrismaTypes } from "generated/prisma/client";
import type { UserRole, UserVerifyStatus } from "generated/prisma/types";

export type UserRow = {
  readonly id: string;
  readonly fullname: string;
  readonly email: string;
  readonly phoneNumber: string | null;
  readonly username: string | null;
  readonly passwordHash: string;
  readonly avatar: string | null;
  readonly location: string | null;
  readonly role: UserRole;
  readonly verify: UserVerifyStatus;
  readonly nfcCardUid: string | null;
  readonly updatedAt: Date;
};

export type CreateUserInput = {
  readonly fullname: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly phoneNumber?: string | null;
  readonly username?: string | null;
  readonly avatar?: string | null;
  readonly location?: string | null;
  readonly role?: UserRole;
  readonly verify?: UserVerifyStatus;
  readonly nfcCardUid?: string | null;
};

export type UpdateUserProfilePatch = Partial<{
  fullname: string;
  phoneNumber: string | null;
  username: string | null;
  avatar: string | null;
  location: string | null;
  role: UserRole;
  verify: UserVerifyStatus;
  nfcCardUid: string | null;
}>;

export type UpdateUserAdminPatch = Partial<{
  fullname: string;
  email: string;
  phoneNumber: string | null;
  username: string | null;
  avatar: string | null;
  location: string | null;
  role: UserRole;
  verify: UserVerifyStatus;
  nfcCardUid: string | null;
}>;

export type UserFilter = {
  readonly fullname?: string;
  readonly email?: string;
  readonly verify?: UserVerifyStatus;
  readonly role?: UserRole;
};

export type UserSortField = "fullname" | "email" | "role" | "verify" | "updatedAt";

export type UserOrderBy = PrismaTypes.UserOrderByWithRelationInput;

export type UserStatsOverview = {
  totalUsers: number;
  totalVerified: number;
  totalUnverified: number;
  totalBanned: number;
};

export type ActiveUsersSeriesRow = {
  date: string;
  activeUsersCount: number;
};

export type TopRenterUser = {
  id: string;
  fullname: string;
  email: string;
  avatar: string | null;
  phoneNumber: string | null;
  location: string | null;
};

export type TopRenterRow = {
  totalRentals: number;
  user: TopRenterUser;
};

export type NewUsersCounts = {
  thisMonth: number;
  lastMonth: number;
};

export type NewUsersStats = {
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  percentageChange: number;
};

export type VipCustomer = {
  userId: string;
  fullname: string;
  totalDuration: number;
} | null;

export type DashboardStatsRaw = {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  vipCustomer: VipCustomer;
  totalRevenue: number;
};

export type DashboardStats = DashboardStatsRaw & {
  averageSpending: number;
};
