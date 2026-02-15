import { z } from "@hono/zod-openapi";

import {
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

export const MeResponseSchema = z.object({
  data: UserDetailSchema,
}).openapi("MeResponse");

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

export const AdminUserListResponseSchema = z.object({
  data: z.array(UserDetailSchema),
  pagination: PaginationSchema,
}).openapi("AdminUserListResponse");

export const AdminUserSearchResponseSchema = z.object({
  data: z.array(UserDetailSchema),
}).openapi("AdminUserSearchResponse");

export const AdminUserDetailResponseSchema = z.object({
  data: UserDetailSchema,
}).openapi("AdminUserDetailResponse");

export const AdminCreateUserRequestSchema = z.object({
  fullname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: OptionalTrimmedNullableStringSchema,
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  role: UserRoleSchema.optional(),
  verify: VerifyStatusSchema.optional(),
  nfcCardUid: z.string().optional().nullable(),
}).openapi("AdminCreateUserRequest");

export const AdminUpdateUserRequestSchema = z.object({
  fullname: z.string().min(1).optional(),
  email: z.email().optional(),
  phoneNumber: OptionalTrimmedNullableStringSchema,
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

export const AdminUserStatsResponseSchema = z.object({
  data: UserStatsOverviewSchema,
}).openapi("AdminUserStatsResponse");

export const ActiveUsersSeriesResponseSchema = z.object({
  data: z.array(ActiveUsersSeriesRowSchema),
}).openapi("ActiveUsersSeriesResponse");

export const TopRentersResponseSchema = z.object({
  data: z.array(TopRenterRowSchema),
  pagination: PaginationSchema,
}).openapi("TopRentersResponse");

export const NewUsersStatsResponseSchema = z.object({
  data: NewUsersStatsSchema,
}).openapi("NewUsersStatsResponse");

export const DashboardStatsResponseSchema = z.object({
  data: DashboardStatsSchema,
}).openapi("DashboardStatsResponse");

export const ActiveUsersQuerySchema = z.object({
  groupBy: z.enum(["day", "month"]),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
});

export const StatsPaginationQuerySchema = z.object({
  ...paginationQueryFields,
});

export type MeResponse = z.infer<typeof MeResponseSchema>;
export type UpdateMeResponse = z.infer<typeof UpdateMeResponseSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
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
