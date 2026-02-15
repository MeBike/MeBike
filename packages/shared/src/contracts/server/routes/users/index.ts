import {
  adminCreateUserRoute,
  changePasswordRoute,
  adminResetPasswordRoute,
  adminUpdateUserRoute,
  updateMeRoute,
} from "./mutations";
import {
  adminActiveUsersRoute,
  adminDashboardStatsRoute,
  adminListUsersRoute,
  adminNewUsersRoute,
  adminSearchUsersRoute,
  adminStatsRoute,
  adminTopRentersRoute,
  adminUserDetailRoute,
  meRoute,
} from "./queries";

export * from "../../users/schemas";
export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const usersRoutes = {
  me: meRoute,
  changePassword: changePasswordRoute,
  updateMe: updateMeRoute,
  adminList: adminListUsersRoute,
  adminSearch: adminSearchUsersRoute,
  adminDetail: adminUserDetailRoute,
  adminUpdate: adminUpdateUserRoute,
  adminCreate: adminCreateUserRoute,
  adminResetPassword: adminResetPasswordRoute,
  adminStats: adminStatsRoute,
  adminActiveUsers: adminActiveUsersRoute,
  adminTopRenters: adminTopRentersRoute,
  adminNewUsers: adminNewUsersRoute,
  adminDashboardStats: adminDashboardStatsRoute,
} as const;
