import * as z from "zod";
export const updateAgencyStatusSchema = z.object({
    status : z.enum(["ACTIVE","INACTIVE","SUSPENDED","BANNED"]),
})
export type UpdateAgencyStatusFormData = z.infer<typeof updateAgencyStatusSchema>;
export const updateSchema = z.object({
    contactPhone :  z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
    name : z.string(),
})
export type UpdateAgencyFormData = z.infer<typeof updateSchema>;
export const registerToAgency = z.object({
  agencyName: z.string().min(1, "Agency name is required"),

  requesterEmail: z.string().email("Invalid email"),

  stationAddress: z.string().min(1, "Station address is required"),

  stationLatitude: z
    .number()
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),

  stationLongitude: z
    .number()
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),

  stationName: z.string().min(1, "Station name is required"),

  stationTotalCapacity: z
    .number()
    .int("Must be integer")
    .min(1, "Must be >= 1"),

  agencyAddress: z.string().optional().nullable(),

  agencyContactPhone: z
    .string()
    .regex(/^\d{10}$/, "Phone must be 10 digits")
    .optional()
    .nullable(),

  description: z.string().optional().nullable(),

  requesterPhone: z
    .string()
    .regex(/^\d{10}$/, "Phone must be 10 digits")
    .optional()
    .nullable(),

  stationPickupSlotLimit: z
    .number()
    .int("Must be integer")
    .min(0, "Must be >= 0")
    .optional(),
});
export type RegisterAgencyFormData = z.infer<typeof registerToAgency>