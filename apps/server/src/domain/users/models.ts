import type { AccountStatus, Prisma as PrismaTypes, UserRole, UserVerifyStatus } from "generated/prisma/client";

export type OrgUnitRef = {
  readonly id: string;
  readonly name: string;
};

export type UserOrgAssignment = {
  readonly station: OrgUnitRef | null;
  readonly agency: OrgUnitRef | null;
  readonly technicianTeam: OrgUnitRef | null;
};

export type UserOrgAssignmentPatch = {
  readonly stationId?: string | null;
  readonly agencyId?: string | null;
  readonly technicianTeamId?: string | null;
};

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
  readonly accountStatus: AccountStatus;
  readonly verify: UserVerifyStatus;
  readonly orgAssignment: UserOrgAssignment | null;
  readonly nfcCardUid: string | null;
  readonly stripeConnectedAccountId: string | null;
  readonly stripePayoutsEnabled: boolean | null;
  readonly createdAt: Date;
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
  readonly accountStatus?: AccountStatus;
  readonly verify?: UserVerifyStatus;
  readonly orgAssignment?: UserOrgAssignmentPatch | null;
  readonly nfcCardUid?: string | null;
};

export type UpdateUserProfilePatch = Partial<{
  fullname: string;
  phoneNumber: string | null;
  username: string | null;
  avatar: string | null;
  location: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
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
  accountStatus: AccountStatus;
  verify: UserVerifyStatus;
  orgAssignment: UserOrgAssignmentPatch | null;
  nfcCardUid: string | null;
}>;

export type UserFilter = {
  readonly fullname?: string;
  readonly email?: string;
  readonly accountStatus?: AccountStatus;
  readonly verify?: UserVerifyStatus;
  readonly role?: UserRole;
  readonly roles?: readonly UserRole[];
  readonly stationId?: string;
  readonly agencyId?: string;
  readonly technicianTeamId?: string;
};

export type UserSortField = "fullname" | "email" | "role" | "accountStatus" | "verify" | "updatedAt";

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
  fullName: string;
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
  fullName: string;
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
