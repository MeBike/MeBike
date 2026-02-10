import { z } from "../../../zod";
import { UserRoleSchema, VerifyStatusSchema } from "./schemas";

export const UserSummarySchema = z.object({
  id: z.uuidv7(),
  fullname: z.string(),
});

export const UserDetailSchema = z.object({
  id: z.uuidv7(),
  fullname: z.string(),
  email: z.string(),
  verify: VerifyStatusSchema,
  location: z.string().nullable(),
  username: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  avatar: z.string().nullable(),
  role: UserRoleSchema,
  nfcCardUid: z.string().nullable(),
  updatedAt: z.string(),
});

export type UserSummary = z.infer<typeof UserSummarySchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;

export const UserStatsOverviewSchema = z.object({
  totalUsers: z.number(),
  totalVerified: z.number(),
  totalUnverified: z.number(),
  totalBanned: z.number(),
});

export const ActiveUsersSeriesRowSchema = z.object({
  date: z.string(),
  activeUsersCount: z.number(),
});

export const TopRenterUserSchema = z.object({
  id: z.uuidv7(),
  fullname: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  location: z.string().nullable(),
});

export const TopRenterRowSchema = z.object({
  totalRentals: z.number(),
  user: TopRenterUserSchema,
});

export const NewUsersStatsSchema = z.object({
  newUsersThisMonth: z.number(),
  newUsersLastMonth: z.number(),
  percentageChange: z.number(),
});

export const VipCustomerSchema = z.object({
  userId: z.uuidv7(),
  fullname: z.string(),
  totalDuration: z.number(),
}).nullable();

export const DashboardStatsSchema = z.object({
  totalCustomers: z.number(),
  activeCustomers: z.number(),
  newCustomersThisMonth: z.number(),
  vipCustomer: VipCustomerSchema,
  totalRevenue: z.number(),
  averageSpending: z.number(),
});

export type UserStatsOverview = z.infer<typeof UserStatsOverviewSchema>;
export type ActiveUsersSeriesRow = z.infer<typeof ActiveUsersSeriesRowSchema>;
export type TopRenterUser = z.infer<typeof TopRenterUserSchema>;
export type TopRenterRow = z.infer<typeof TopRenterRowSchema>;
export type NewUsersStats = z.infer<typeof NewUsersStatsSchema>;
export type VipCustomer = z.infer<typeof VipCustomerSchema>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
