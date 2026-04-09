import { z } from "@hono/zod-openapi";

import {
  OptionalPhoneNumberNullableSchema,
  OptionalTrimmedNullableStringSchema,
  paginationQueryFields,
  PaginationSchema,
} from "../../schemas";
import {
  TechnicianTeamAvailableOptionSchema,
  UserSummarySchema,
} from "../../users/models";
import {
  AccountStatusSchema,
  ActiveUsersSeriesRowSchema,
  AdminManageableUserRoleSchema,
  DashboardStatsSchema,
  NewUsersStatsSchema,
  TopRenterRowSchema,
  UserDetailSchema,
  UserErrorCodeSchema,
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

export const UploadAvatarRequestSchema = z.object({
  avatar: z.any().openapi({
    type: "string",
    format: "binary",
  }),
}).openapi("UploadAvatarRequest");

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

export const AdminTechnicianListResponseSchema = z.object({
  data: z.array(UserSummarySchema),
}).openapi("AdminTechnicianListResponse");

export const AdminAvailableTechnicianTeamListResponseSchema = z.object({
  data: z.array(TechnicianTeamAvailableOptionSchema),
}).openapi("AdminAvailableTechnicianTeamListResponse");

export const AdminUserDetailResponseSchema = UserDetailSchema.openapi("AdminUserDetailResponse");

const AdminUserOrgAssignmentInputSchema = z
  .object({
    stationId: z.uuidv7().optional(),
    technicianTeamId: z.uuidv7().optional(),
  })
  .superRefine((data, ctx) => {
    const count = Number(data.stationId !== undefined)
      + Number(data.technicianTeamId !== undefined);

    if (count > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide only one org assignment scope.",
      });
    }
  });

const AdminCreateStandardUserRequestSchema = z.object({
  fullname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: OptionalPhoneNumberNullableSchema,
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  role: AdminManageableUserRoleSchema.optional(),
  accountStatus: AccountStatusSchema.optional(),
  verify: VerifyStatusSchema.optional(),
  orgAssignment: AdminUserOrgAssignmentInputSchema.optional().nullable(),
  nfcCardUid: z.string().optional().nullable(),
}).openapi("AdminCreateStandardUserRequest", {
  example: {
    fullname: "Tran Staff",
    email: "tran.staff@example.com",
    password: "password123",
    phoneNumber: "0912345678",
    username: "transtaff",
    avatar: null,
    location: "Thu Duc, TP.HCM",
    role: "STAFF",
    accountStatus: "ACTIVE",
    verify: "VERIFIED",
    orgAssignment: {
      stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
    },
    nfcCardUid: null,
  },
});

const AgencyStationLatitudeSchema = z.number().min(-90).max(90);
const AgencyStationLongitudeSchema = z.number().min(-180).max(180);

export const AdminCreateAgencyUserRequestSchema = z.object({
  role: z.literal("AGENCY"),
  requesterEmail: z.string().email(),
  requesterPhone: OptionalPhoneNumberNullableSchema,
  agencyName: z.string().trim().min(1),
  agencyAddress: OptionalTrimmedNullableStringSchema,
  agencyContactPhone: OptionalPhoneNumberNullableSchema,
  stationName: z.string().trim().min(1),
  stationAddress: z.string().trim().min(1),
  stationLatitude: AgencyStationLatitudeSchema,
  stationLongitude: AgencyStationLongitudeSchema,
  stationTotalCapacity: z.number().int().min(1),
  stationPickupSlotLimit: z.number().int().min(0).optional(),
  stationReturnSlotLimit: z.number().int().min(0).optional(),
  description: OptionalTrimmedNullableStringSchema,
}).superRefine((value, ctx) => {
  const pickupSlotLimit = value.stationPickupSlotLimit ?? value.stationTotalCapacity;
  const returnSlotLimit = value.stationReturnSlotLimit ?? value.stationTotalCapacity;

  if (pickupSlotLimit > value.stationTotalCapacity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stationPickupSlotLimit"],
      message: "stationPickupSlotLimit must be less than or equal to stationTotalCapacity",
    });
  }

  if (returnSlotLimit > value.stationTotalCapacity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stationReturnSlotLimit"],
      message: "stationReturnSlotLimit must be less than or equal to stationTotalCapacity",
    });
  }
}).openapi("AdminCreateAgencyUserRequest", {
  example: {
    role: "AGENCY",
    requesterEmail: "ops.metro.thuduc@example.com",
    requesterPhone: "0912345678",
    agencyName: "Metro Agency Thu Duc",
    agencyAddress: "Tret toa nha Metro Thu Duc",
    agencyContactPhone: "0987654321",
    stationName: "Ga Metro Thu Duc",
    stationAddress: "01 Xa Lo Ha Noi, Thu Duc, TP.HCM",
    stationLatitude: 10.8486,
    stationLongitude: 106.7717,
    stationTotalCapacity: 20,
    stationPickupSlotLimit: 12,
    stationReturnSlotLimit: 18,
    description: "Admin tao truc tiep doi tac agency moi.",
  },
});

export const AdminCreateUserRequestSchema = z.union([
  AdminCreateStandardUserRequestSchema,
  AdminCreateAgencyUserRequestSchema,
]).openapi("AdminCreateUserRequest");

export const AdminUpdateUserRequestSchema = z.object({
  fullname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: OptionalPhoneNumberNullableSchema,
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  role: AdminManageableUserRoleSchema.optional(),
  accountStatus: AccountStatusSchema.optional(),
  verify: VerifyStatusSchema.optional(),
  orgAssignment: AdminUserOrgAssignmentInputSchema.optional().nullable(),
  nfcCardUid: z.string().optional().nullable(),
}).openapi("AdminUpdateUserRequest", {
  example: {
    role: "STAFF",
    accountStatus: "ACTIVE",
    verify: "VERIFIED",
    orgAssignment: {
      stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
    },
  },
});

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
    description: "Time bucket granularity for the series. day = daily buckets, month = monthly buckets. Defaults to month when omitted.",
    example: "month",
  });

const ActiveUsersStartDateSchema = z
  .iso
  .datetime()
  .openapi({
    description: "Inclusive range start (ISO datetime). Must be provided together with endDate. If both dates are omitted, the API defaults to the previous full calendar month (UTC).",
    example: "2026-02-01T00:00:00.000Z",
  });

const ActiveUsersEndDateSchema = z
  .iso
  .datetime()
  .openapi({
    description: "Inclusive range end (ISO datetime). Must be provided together with startDate. If both dates are omitted, the API defaults to the previous full calendar month (UTC).",
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
export type AdminTechnicianListResponse = z.infer<typeof AdminTechnicianListResponseSchema>;
export type AdminAvailableTechnicianTeamListResponse = z.infer<typeof AdminAvailableTechnicianTeamListResponseSchema>;
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
