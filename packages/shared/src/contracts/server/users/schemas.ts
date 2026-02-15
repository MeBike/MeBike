import { z } from "../../../zod";
import { ServerErrorResponseSchema } from "../schemas";

export const UserRoleSchema = z.enum(["USER", "STAFF", "ADMIN", "SOS"]);

export const VerifyStatusSchema = z.enum(["UNVERIFIED", "VERIFIED", "BANNED"]);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type VerifyStatus = z.infer<typeof VerifyStatusSchema>;

export const UserErrorCodeSchema = z.enum([
  "USER_NOT_FOUND",
  "DUPLICATE_EMAIL",
  "DUPLICATE_PHONE_NUMBER",
  "INVALID_CURRENT_PASSWORD",
]).openapi("UserErrorCode");

export const userErrorMessages = {
  USER_NOT_FOUND: "User not found",
  DUPLICATE_EMAIL: "Email already in use",
  DUPLICATE_PHONE_NUMBER: "Phone number already in use",
  INVALID_CURRENT_PASSWORD: "Current password is incorrect",
} as const;

export const UserStatsErrorCodeSchema = z.enum([
  "INVALID_DATE_RANGE",
  "INVALID_GROUP_BY",
]).openapi("UserStatsErrorCode");

export const userStatsErrorMessages = {
  INVALID_DATE_RANGE: "Invalid date range",
  INVALID_GROUP_BY: "Invalid groupBy value",
} as const;

export const UserStatsErrorDetailSchema = z
  .object({
    code: UserStatsErrorCodeSchema,
  })
  .openapi("UserStatsErrorDetail", {
    description: "User stats error detail",
  });

export const UserStatsErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: UserStatsErrorDetailSchema.optional(),
}).openapi("UserStatsErrorResponse", {
  description: "Standard error payload for user stats endpoints",
});

export type UserStatsErrorDetail = z.infer<typeof UserStatsErrorDetailSchema>;
export type UserStatsErrorResponse = z.infer<typeof UserStatsErrorResponseSchema>;

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
