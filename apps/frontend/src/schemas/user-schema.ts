import * as z from "zod";
import type { VerifyStatus } from "@/types";
import { isValidUUID } from "@utils";
export const userProfileSchema = z.object({
  fullname: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.email("Email không hợp lệ"),
  phoneNumber: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  role: z.enum(["USER", "STAFF", "ADMIN","TECHNICIAN","MANAGER"]),
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
  // accountStatus :  z.enum(["ACTIVE","INACTIVE","SUSPENDED","BANNED",""]),
  // verify : z.enum(["VERIFIED","UNVERIFIED"]),
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
const updateBaseUserSchema = z.object({
  fullname: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  phoneNumber: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự").optional(),
  accountStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"]).optional(),
  verify: z.enum(["VERIFIED", "UNVERIFIED"]).optional(),
});
export const updateStaffSchema = z.discriminatedUnion("role",[
  updateBaseUserSchema.extend({
    role : z.literal("USER"),
  }),
  updateBaseUserSchema.extend({
    role : z.literal("ADMIN"),
  }),
  updateBaseUserSchema.extend({
    role : z.literal("STAFF"),
    orgAssignment : z.object({
      stationId : z.string().refine(isValidUUID),
    })
  }),
  updateBaseUserSchema.extend({
    role : z.literal("MANAGER"),
    orgAssignment : z.object({
      stationId : z.string().refine(isValidUUID),
    })
  }),
  updateBaseUserSchema.extend({
    role : z.literal("AGENCY"),
    orgAssignment : z.object({
      stationId : z.string().refine(isValidUUID),
    })
  }),
  updateBaseUserSchema.extend({
    role : z.literal("TECHNICIAN"),
    orgAssignment : z.object({
      technicianTeamId : z.string().refine(isValidUUID),
    })
  }),
])
const updateUserSchema = z.object({
  accountStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"]).optional(),
  verify: z.enum(["VERIFIED", "UNVERIFIED"]).optional(),
});
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type UpdateStaffFormData = z.infer<typeof updateStaffSchema>