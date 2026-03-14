import { z } from "@hono/zod-openapi";

import {
  OptionalPhoneNumberNullableSchema,
  OptionalTrimmedNullableStringSchema,
  paginationQueryFields,
  PaginationSchema,
} from "../../schemas";
import {
  ActiveUsersSeriesRowSchema,
  DashboardStatsSchema,
  NewUsersStatsSchema,
  TopRenterRowSchema,
  UserDetailSchema,
  UserErrorCodeSchema,
  UserRoleSchema,
  UserStatsOverviewSchema,
  VerifyStatusSchema,
} from "../../users/schemas";

export const UserErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: UserErrorCodeSchema,
  }),
}).openapi("UserErrorResponse");

export const MeResponseSchema = UserDetailSchema.openapi("MeResponse");

export const UpdateMeRequestSchema = z.object({
  fullname: z.string().min(1).optional(),
  phoneNumber: OptionalTrimmedNullableStringSchema,
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
}).openapi("UpdateMeRequest");

export const UpdateMeResponseSchema = MeResponseSchema;

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
}).openapi("ChangePasswordRequest");

export const PushTokenPlatformSchema = z.enum(["ANDROID", "IOS", "UNKNOWN"])
  .openapi("PushTokenPlatform");

export const RegisterPushTokenRequestSchema = z.object({
  token: z.string().min(1),
  platform: PushTokenPlatformSchema.optional(),
  deviceId: z.string().optional().nullable(),
  appVersion: z.string().optional().nullable(),
}).openapi("RegisterPushTokenRequest");

export const UnregisterPushTokenRequestSchema = z.object({
  token: z.string().min(1),
}).openapi("UnregisterPushTokenRequest");

export const PushTokenSummarySchema = z.object({
  id: z.uuidv7(),
  platform: PushTokenPlatformSchema,
  deviceId: z.string().nullable(),
  appVersion: z.string().nullable(),
  isActive: z.boolean(),
  maskedToken: z.string(),
  lastSeenAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("PushTokenSummary");

export const AdminUserListResponseSchema = z.object({
  data: z.array(UserDetailSchema),
  pagination: PaginationSchema,
}).openapi("AdminUserListResponse");

export const AdminUserSearchResponseSchema = z.object({
  data: z.array(UserDetailSchema),
}).openapi("AdminUserSearchResponse");

export const AdminUserDetailResponseSchema = UserDetailSchema.openapi("AdminUserDetailResponse");

export const AdminCreateUserRequestSchema = z.object({
  fullname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: OptionalPhoneNumberNullableSchema,
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  role: UserRoleSchema.optional(),
  verify: VerifyStatusSchema.optional(),
  nfcCardUid: z.string().optional().nullable(),
}).openapi("AdminCreateUserRequest");

export const AdminUpdateUserRequestSchema = z.object({
  fullname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: OptionalPhoneNumberNullableSchema,
  username: z.string().optional().nullable(),
  avatar: z.url().optional().nullable(),
  location: z.string().optional().nullable(),
  role: UserRoleSchema.optional(),
  verify: VerifyStatusSchema.optional(),
  nfcCardUid: z.string().optional().nullable(),
}).openapi("AdminUpdateUserRequest");

export const AdminResetPasswordRequestSchema = z.object({
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
}).openapi("AdminResetPasswordRequest");

export const AdminUserStatsResponseSchema = UserStatsOverviewSchema.openapi("AdminUserStatsResponse");

export const ActiveUsersSeriesResponseSchema = z.object({
  data: z.array(ActiveUsersSeriesRowSchema),
}).openapi("ActiveUsersSeriesResponse");

export const TopRentersResponseSchema = z.object({
  data: z.array(TopRenterRowSchema),
  pagination: PaginationSchema,
}).openapi("TopRentersResponse");

export const NewUsersStatsResponseSchema = NewUsersStatsSchema.openapi("NewUsersStatsResponse");

export const DashboardStatsResponseSchema = DashboardStatsSchema.openapi("DashboardStatsResponse");

const ActiveUsersGroupBySchema = z
  .enum(["day", "month"])
  .openapi({
    description: "Time bucket granularity for the series. day = daily buckets, month = monthly buckets.",
    example: "month",
  });

const ActiveUsersStartDateSchema = z
  .iso
  .datetime()
  .openapi({
    description: "Inclusive range start (ISO datetime). Must be provided together with endDate.",
    example: "2026-02-01T00:00:00.000Z",
  });

const ActiveUsersEndDateSchema = z
  .iso
  .datetime()
  .openapi({
    description: "Inclusive range end (ISO datetime). Must be provided together with startDate.",
    example: "2026-02-28T23:59:59.999Z",
  });

export const ActiveUsersQuerySchema = z
  .object({
    groupBy: ActiveUsersGroupBySchema.optional(),
    startDate: ActiveUsersStartDateSchema.optional(),
    endDate: ActiveUsersEndDateSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasStart = data.startDate !== undefined;
    const hasEnd = data.endDate !== undefined;

    if (hasStart && !hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endDate is required when startDate is provided.",
        path: ["endDate"],
      });
    }

    if (!hasStart && hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startDate is required when endDate is provided.",
        path: ["startDate"],
      });
    }
  });

export const StatsPaginationQuerySchema = z.object({
  ...paginationQueryFields,
});

export type MeResponse = z.infer<typeof MeResponseSchema>;
export type UpdateMeResponse = z.infer<typeof UpdateMeResponseSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type RegisterPushTokenRequest = z.infer<typeof RegisterPushTokenRequestSchema>;
export type UnregisterPushTokenRequest = z.infer<typeof UnregisterPushTokenRequestSchema>;
export type PushTokenSummary = z.infer<typeof PushTokenSummarySchema>;
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;
export type AdminUserSearchResponse = z.infer<typeof AdminUserSearchResponseSchema>;
export type AdminUserDetailResponse = z.infer<typeof AdminUserDetailResponseSchema>;
export type AdminCreateUserRequest = z.infer<typeof AdminCreateUserRequestSchema>;
export type AdminUpdateUserRequest = z.infer<typeof AdminUpdateUserRequestSchema>;
export type AdminResetPasswordRequest = z.infer<typeof AdminResetPasswordRequestSchema>;
export type AdminUserStatsResponse = z.infer<typeof AdminUserStatsResponseSchema>;
export type ActiveUsersSeriesResponse = z.infer<typeof ActiveUsersSeriesResponseSchema>;
export type TopRentersResponse = z.infer<typeof TopRentersResponseSchema>;
export type NewUsersStatsResponse = z.infer<typeof NewUsersStatsResponseSchema>;
export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponseSchema>;
export type UserErrorResponse = {
  error: string;
  details: {
    code: z.infer<typeof UserErrorCodeSchema>;
  };
};
