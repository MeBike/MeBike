import { Router } from "express";

import type { UpdateMeReqBody, UpdateUserReqBody } from "~/models/requests/users.requests";

import { adminAndStaffGetAllUsersController, changePasswordController, forgotPasswordController, getMeController, getUserDetailController, loginController, logoutController, refreshController, registerController, resendEmailVerifyController, resetPasswordController, searchUsersController, updateMeController, updateUserByIdController, verifyEmailOtpController } from "~/controllers/users.controllers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { accessTokenValidator, adminAndStaffGetAllUsersValidator, changePasswordValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, searchUsersValidator, updateMeValidator, updateUserByIdValidator, userDetailValidator, verifiedUserValidator, verifyEmailOtpValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";
import { isAdminAndStaffValidator, isAdminValidator } from "~/middlewares/admin.middlewares";

const usersRouter = Router();

usersRouter.post("/login", loginValidator, wrapAsync(loginController));
usersRouter.post("/register", registerValidator, wrapAsync(registerController));
usersRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));
usersRouter.post("/forgot-password", forgotPasswordValidator, wrapAsync(forgotPasswordController));
usersRouter.post(
  "/reset-password",
  resetPasswordValidator,
  wrapAsync(resetPasswordController),
);
usersRouter.post("/verify-email",
  verifyEmailOtpValidator,
  wrapAsync(verifyEmailOtpController));
usersRouter.post("/resend-verify-email",
  accessTokenValidator,
  wrapAsync(resendEmailVerifyController));
usersRouter.put(
  "/change-password",
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController),
);
usersRouter.get("/me", accessTokenValidator, wrapAsync(getMeController));
usersRouter.patch(
  "/me",
  accessTokenValidator,
  filterMiddleware<UpdateMeReqBody>(["fullname", "location", "username", "avatar", "phone_number"]),
  updateMeValidator,
  wrapAsync(updateMeController),
);
usersRouter.post("/refresh-token", refreshTokenValidator, wrapAsync(refreshController));

/**
 * Description: Admin and Staff get all users with pagination and filters
 * Path: /users/manage-users/get-all
 * Method: GET
 * Header: Authorization
 * Roles: Admin, Staff
 * Query Params:
 *    - fullname: string (optional)
 *    - verify: 'VERIFIED' | 'UNVERIFIED' | 'BANNED' (optional)
 *    - role: 'USER' | 'STAFF' | 'ADMIN' (optional)
 */
usersRouter.get("/manage-users/get-all",
  accessTokenValidator,
  isAdminAndStaffValidator,
  adminAndStaffGetAllUsersValidator,
  wrapAsync(adminAndStaffGetAllUsersController)
);

/**
 * Description: Search for users by email or phone (for Admin/Staff)
 * Path: /users/search
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 * Query: { q: string }
 * Roles: ADMIN, STAFF
 */
usersRouter.get(
  "/manage-users/search",
  accessTokenValidator,
  isAdminAndStaffValidator,
  searchUsersValidator,
  wrapAsync(searchUsersController)
);

/**
 * Description: Get user detail by ID (for Admin/Staff)
 * Path: /users/manage-users/:_id
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 * Params: { _id: string }
 * Roles: ADMIN, STAFF
 */
usersRouter.get('/manage-users/:_id',
  accessTokenValidator,
  isAdminAndStaffValidator,
  userDetailValidator,
  wrapAsync(getUserDetailController)
);

/**
 * Description: Update user by ID (for Admin/Staff)
 * Path: /users/manage-users/:_id
 * Method: PATCH
 * Headers: { Authorization: Bearer <access_token> }
 * Params: { _id: string }
 * Body: UpdateUserReqBody (optional fields)
 * Roles: ADMIN, STAFF
 */
usersRouter.patch(
  '/manage-users/:_id',
  accessTokenValidator,
  isAdminAndStaffValidator,
  userDetailValidator,
  filterMiddleware<UpdateUserReqBody>([
    'fullname',
    'email',
    'verify',
    'location',
    'username',
    'phone_number',
    'role',
    'nfc_card_uid'
  ]),
  updateUserByIdValidator,
  wrapAsync(updateUserByIdController)
)

export default usersRouter;
