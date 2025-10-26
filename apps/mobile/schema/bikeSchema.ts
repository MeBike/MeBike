import * as z from "zod";

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}
export const bikeSchema = z.object({
  station_id: z
    .string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
  status: z.boolean(),
  supplier_id: z
    .string()
    .min(24, "Supplier ID must be a valid ObjectId")
    .max(24, "Supplier ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Supplier ID must be a valid MongoDB ObjectId",
    })
    .optional(),
});
export const updateBikeSchema = z.object({
  station_id: z
    .string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
  status: z.boolean(),
  supplier_id: z
    .string()
    .min(24, "Supplier ID must be a valid ObjectId")
    .max(24, "Supplier ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Supplier ID must be a valid MongoDB ObjectId",
    })
    .optional(),
});
export type BikeSchemaFormData = z.infer<typeof bikeSchema>;
export type UpdateBikeSchemaFormData = z.infer<typeof updateBikeSchema>;
