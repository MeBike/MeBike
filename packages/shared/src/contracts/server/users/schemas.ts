import { z } from "../../../zod";

export const UserRoleSchema = z.enum(["USER", "STAFF", "ADMIN", "SOS"]);

export const VerifyStatusSchema = z.enum(["UNVERIFIED", "VERIFIED", "BANNED"]);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type VerifyStatus = z.infer<typeof VerifyStatusSchema>;

export const UserErrorCodeSchema = z.enum([
  "USER_NOT_FOUND",
  "DUPLICATE_EMAIL",
  "DUPLICATE_PHONE_NUMBER",
]).openapi("UserErrorCode");

export const userErrorMessages = {
  USER_NOT_FOUND: "User not found",
  DUPLICATE_EMAIL: "Email already in use",
  DUPLICATE_PHONE_NUMBER: "Phone number already in use",
} as const;

export {
  ActiveUsersSeriesRowSchema,
  DashboardStatsSchema,
  NewUsersStatsSchema,
  TopRenterRowSchema,
  TopRenterUserSchema,
  UserDetailSchema,
  UserStatsOverviewSchema,
  UserSummarySchema,
  VipCustomerSchema,
} from "./models";
