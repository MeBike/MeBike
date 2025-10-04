import type { Request, Response } from "express";
import type { ObjectId } from "mongodb";

import type User from "~/models/schemas/user.schema";

import { RENTALS_MESSAGE } from "~/constants/messages";
import rentalsService from "~/services/rentals.services";

export async function createRentalSessionController(req: Request, res: Response) {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await rentalsService.createRentalSession(user_id);
  res.json({
    message: RENTALS_MESSAGE.CREATE_SESSION_SUCCESS,
    result,
  });
}
