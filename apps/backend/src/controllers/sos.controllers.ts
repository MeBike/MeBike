import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { ObjectId } from "mongodb"
import { SOS_MESSAGE } from "~/constants/messages"
import { CreateSosPayload, CreateSosReqBody, DispatchSosReqBody, SosParam } from "~/models/requests/sos.requests"
import { TokenPayLoad } from "~/models/requests/users.requests"
import Rental from "~/models/schemas/rental.schema"
import sosService from "~/services/sos.services"
import { toObjectId } from "~/utils/string"

export async function createSosAlertController(req: Request<ParamsDictionary, any, CreateSosReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad 
  const rental = req.rental as Rental
  const bike_id = toObjectId(rental.bike_id)
  const payload: CreateSosPayload = {
    ...req.body,
    rental_id: rental._id as ObjectId,
    bike_id,
    user_id: toObjectId(user_id)
  }

  const result = await sosService.createAlert(payload)

  res.json({
    message: SOS_MESSAGE.SOS_SENT_SUCCESS,
    result
  })
}

export async function dispatchSosController(
  req: Request<SosParam, any, DispatchSosReqBody>,
  res: Response
) {
  const { user_id } = req.decoded_authorization as TokenPayLoad;
  const { agent_id } = req.body;
  const { id } = req.params;

  const result = await sosService.dispatchSos({
    sos_id: id,
    staff_id: user_id,
    agent_id,
  });

  res.json({
    message: SOS_MESSAGE.SOS_DISPATCHED_SUCCESS,
    result,
  });
}