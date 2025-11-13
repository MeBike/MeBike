import * as z from "zod";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}
export const rentalSchema = z.object({
  bike_id: z
    .string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
  subscription_id: z
    .string()
    .min(24, "Subscription ID must be a valid ObjectId")
    .max(24, "Subscription ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Subscription ID must be a valid MongoDB ObjectId",
    })
    .optional(),
});
export const endRentalSchema = z.object({
  end_station: z.string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
});
export type EndRentalSchema = z.infer<typeof endRentalSchema>;
export type RentalSchemaFormData = z.infer<typeof rentalSchema>;
