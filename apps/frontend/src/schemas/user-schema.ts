import * as z from "zod";
import type { VerifyStatus } from "@/types";
import { isValidUUID } from "@utils";
export const userProfileSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.email("Email không hợp lệ"),
  phoneNumber: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  role: z.enum(["USER", "STAFF", "ADMIN"]),
  verify: z.enum([] as VerifyStatus[]).optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
export const createUserSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.email("Email không hợp lệ"),
  phoneNumber: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
  role: z.enum(["USER", "STAFF", "ADMIN"]),
});
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export const updateStaffSchema = z.object({
  role: z.enum(["STAFF", "AGENCY", "MANAGER"]),
  accountStatus: z.enum(["VERIFIED", "UNVERIFIED"]),
  orgAssignment: z.object({
    stationId: z.string().refine(isValidUUID, {
      message: "Mã trạm phải là một UUID hợp lệ",
    }),
    technicianTeamId: z.string().refine(isValidUUID, {
      message: "Mã technician phải là một UUID hợp lệ",
    }),
  }),
});
export type UpdateStaffFormData = z.infer<typeof updateStaffSchema>