import * as z from "zod";
export const updateAgencyStatusSchema = z.object({
    status : z.enum(["ACTIVE","INACTIVE","SUSPENDED","BANNED"]),
})
export type UpdateAgencyStatusFormData = z.infer<typeof updateAgencyStatusSchema>;
export const updateSchema = z.object({
    contactPhone : z
      .string()
      .length(10, "Số điện thoại phải bao gồm chính xác 10 chữ số")
      .regex(/^[0-9]+$/, "Chỉ được nhập số"),
    name : z.string(),
})
export type UpdateAgencyFormData = z.infer<typeof updateSchema>;
const AgencyStationLatitudeSchema = z.number()
    .min(-90).max(90); // Cho phép rộng hơn để tránh lỗi khi chưa load kịp map
const AgencyStationLongitudeSchema = z.number()
    .min(-180).max(180);

export const registerToAgencySchema = z.object({
  requesterEmail: z.string().email("Email không hợp lệ"),
  requesterPhone: z
    .string()
    .length(10, "Số điện thoại phải bao gồm chính xác 10 chữ số")
    .regex(/^[0-9]+$/, "Chỉ được nhập số"),
  agencyName: z.string().min(1, "Tên Agency là bắt buộc"),
  agencyAddress: z.string().min(1, "Địa chỉ Agency là bắt buộc"),
  agencyContactPhone: z
    .string()
    .length(10, "Số điện thoại phải bao gồm chính xác 10 chữ số")
    .regex(/^[0-9]+$/, "Chỉ được nhập số"),
  stationName: z.string().min(1, "Tên trạm là bắt buộc"),
  stationAddress: z.string().min(1, "Địa chỉ trạm là bắt buộc"),
  stationTotalCapacity: z.number().int().min(1).max(40, "Tối đa 40 xe"),
  stationReturnSlotLimit :z.number().int().min(1).max(40, "Tối đa 40 xe"),
  stationLatitude: z.number().min(8.1, "Vĩ độ không thuộc VN").max(23.4, "Vĩ độ không thuộc VN"),
  stationLongitude: z.number().min(102.1, "Kinh độ không thuộc VN").max(109.5, "Kinh độ không thuộc VN"),
  description: z.string().optional().nullable(),
});
export type RegisterAgencyFormData = z.infer<typeof registerToAgencySchema>;

export const adminCreateAgencyUserRequestSchema = z.object({
  role: z.literal("AGENCY"),
  requesterEmail: z.email("Email không hợp lệ"),
  requesterPhone:z
    .string()
    .length(10, "Số điện thoại phải bao gồm chính xác 10 chữ số")
    .regex(/^[0-9]+$/, "Chỉ được nhập số"),
  agencyName: z.string().trim().min(1,"Agency Name là bắt buộc"),
  agencyAddress: z.string().min(1,"Địa chỉ agency là bắt buộc"),
  agencyContactPhone:z
    .string()
    .length(10, "Số điện thoại phải bao gồm chính xác 10 chữ số")
    .regex(/^[0-9]+$/, "Chỉ được nhập số"),
  stationName: z.string().trim().min(1,"Tên trạm là bắt buộc"),
  stationAddress: z.string().trim().min(1,"Địa chỉ trạm là bắt buộc"),
  stationLatitude: AgencyStationLatitudeSchema,
  stationLongitude: AgencyStationLongitudeSchema,
  stationTotalCapacity: z
    .number()
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu là 1")
    .max(40, "Sức chứa tối đa của trạm chỉ được 40 xe"),
  stationReturnSlotLimit:z
    .number()
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu là 1")
    .max(40, "Sức chứa tối đa của trạm chỉ được 40 xe"),
  description: z.string().trim().optional(),
}).superRefine((value, ctx) => {
  const returnSlotLimit = value.stationReturnSlotLimit ?? value.stationTotalCapacity;
  if (returnSlotLimit > value.stationTotalCapacity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stationReturnSlotLimit"],
      message: "stationReturnSlotLimit must be less than or equal to stationTotalCapacity",
    });
  }
})
export type AdminCreateAgencyUserRequest = z.infer<typeof adminCreateAgencyUserRequestSchema>