import * as z from "zod";
export const stationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be at most 200 characters"),
  address: z.string().min(1, "Address is required"),
  latitude: z
    .string({
      error: "Latitude is required",
    })
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Latitude must be a number",
    }),
  longitude: z
    .string({
      error: "Longitude is required",
    })
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Longitude must be a number",
    }),
  capacity: z
    .string({
      error: "Longitude is required",
    })
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Longitude must be a integer number",
    }),
});
export type StationSchemaFormData = z.infer<typeof stationSchema>;
