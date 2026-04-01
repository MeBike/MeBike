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
// export const createUserSchema = z.object({
//   fullname: z.string().min(1, "Họ tên là bắt buộc"),
//   email: z.email("Email không hợp lệ"),
//   phoneNumber: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
//   role: z.enum(["USER", "STAFF", "ADMIN"]),
  
// });
export type CreateUserFormData = z.infer<typeof createUserSchema>;
const baseUserSchema = z.object({
  fullname : z.string().min(1, "Họ tên là bắt buộc"),
  email : z.email("Email không hợp lệ"),
  phoneNumber : z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
  password : z.string().min(10,"Password phải ít nhất 10 kí tự"),
});
export const createUserSchema = z.discriminatedUnion("role",[
  baseUserSchema.extend({
    role : z.literal("USER"),
  }),
  baseUserSchema.extend({
    role : z.literal("ADMIN"),
  }),
  baseUserSchema.extend({
    role : z.literal("STAFF"),
    orgAssignment : z.object({
      stationId : z.string().refine(isValidUUID),
    })
  }),
  baseUserSchema.extend({
    role : z.literal("MANAGER"),
    orgAssignment : z.object({
      stationId : z.string().refine(isValidUUID),
    })
  }),
  baseUserSchema.extend({
    role : z.literal("AGENCY"),
    orgAssignment : z.object({
      stationId : z.string().refine(isValidUUID),
    })
  }),
  baseUserSchema.extend({
    role : z.literal("TECHNICIAN"),
    orgAssignment : z.object({
      technicianTeamId : z.string().refine(isValidUUID),
    })
  }),
])
export const updateStaffSchema = z.discriminatedUnion("role",[
  z.object({
    role : z.literal("STAFF"),
    accountStatus : z.enum(["ACTIVE","INACTIVE","SUSPENDED","BANNED",""]),
    verify : z.enum(["VERIFIED","UNVERIFIED"]),
    orgAssignment : z.object({
      stationId : z.string().refine(isValidUUID),
    })
  }),
  z.object({
    role : z.literal("TECHNICIAN"),
    accountStatus : z.enum(["ACTIVE","INACTIVE","SUSPENDED","BANNED",""]),
    verify : z.enum(["VERIFIED","UNVERIFIED"]),
    orgAssignment : z.object({
      technicianTeamId : z.string().refine(isValidUUID),
    })
  })
])
export type UpdateStaffFormData = z.infer<typeof updateStaffSchema>