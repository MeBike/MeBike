import { ObjectId } from "mongodb"

export type CreateSosReqBody = {
  rental_id: string | ObjectId,
  issue: string,
  latitude: number,
  longitude: number
  staff_notes?: string
}

export interface CreateSosPayload extends CreateSosReqBody {
  rental_id: ObjectId
  user_id: ObjectId
  bike_id: ObjectId
}

export type DispatchSosReqBody = {
  agent_id: string;
}

export type SosParam = {
  id: string
}

