import * as z from "zod";
import { en } from "zod/v4/locales";

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const rentalSchema = z.object({
    bike_id : z
      .string()
      .min(24, "Station ID must be a valid ObjectId")
      .max(24, "Station ID must be a valid ObjectId")
      .refine(isValidObjectId, {
        message: "Station ID must be a valid MongoDB ObjectId",
      }),
});
export const endRentalSchema = z.object({
    end_station : z.string()
      .min(24, "Station ID must be a valid ObjectId")
      .max(24, "Station ID must be a valid ObjectId")
      .refine(isValidObjectId, {
        message: "Station ID must be a valid MongoDB ObjectId",
      }),
});
export type EndRentalSchema = z.infer<typeof endRentalSchema>;
export type RentalSchemaFormData = z.infer<typeof rentalSchema>;