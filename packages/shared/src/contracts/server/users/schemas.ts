import { z } from "../../../zod";
import { ServerErrorResponseSchema } from "../schemas";

export const UserRoleSchema = z.enum([
  "USER",
  "STAFF",
  "TECHNICIAN",
  "MANAGER",
  "ADMIN",
  "AGENCY",
]);

export const AdminManageableUserRoleSchema = z.enum([
  "USER",
  "STAFF",
  "TECHNICIAN",
  "MANAGER",
  "ADMIN",
]);

export const AccountStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"]);
export const VerifyStatusSchema = z.enum(["UNVERIFIED", "VERIFIED"]);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
export type VerifyStatus = z.infer<typeof VerifyStatusSchema>;

export const UserErrorCodeSchema = z.enum([
  "USER_NOT_FOUND",
  "DUPLICATE_EMAIL",
  "DUPLICATE_PHONE_NUMBER",
  "AVATAR_IMAGE_TOO_LARGE",
  "INVALID_AVATAR_IMAGE",
  "AVATAR_IMAGE_DIMENSIONS_TOO_LARGE",
  "AVATAR_UPLOAD_UNAVAILABLE",
  "INVALID_CURRENT_PASSWORD",
  "INVALID_PUSH_TOKEN",
  "INVALID_ORG_ASSIGNMENT",
  "TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED",
]).openapi("UserErrorCode");

export const userErrorMessages = {
  USER_NOT_FOUND: "User not found",
  DUPLICATE_EMAIL: "Email already in use",
  DUPLICATE_PHONE_NUMBER: "Phone number already in use",
  AVATAR_IMAGE_TOO_LARGE: "Avatar image is too large",
  INVALID_AVATAR_IMAGE: "Avatar image is invalid or unsupported",
  AVATAR_IMAGE_DIMENSIONS_TOO_LARGE: "Avatar image dimensions are too large",
  AVATAR_UPLOAD_UNAVAILABLE: "Avatar upload is temporarily unavailable",
  INVALID_CURRENT_PASSWORD: "Current password is incorrect",
  INVALID_PUSH_TOKEN: "Invalid push token",
  INVALID_ORG_ASSIGNMENT: "Invalid org assignment for role",
  TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED: "Technician team already has maximum members",
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
  UserOrgAssignmentSchema,
  UserStatsOverviewSchema,
  UserSummarySchema,
  VipCustomerSchema,
} from "./models";
