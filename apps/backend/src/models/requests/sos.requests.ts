import { ObjectId } from "mongodb"

export type CreateSosReqBody = {
  rental_id: string | ObjectId,
  issue: string,
  latitude: number,
  longitude: number
  agent_id: string
  staff_notes?: string
}

export interface CreateSosPayload extends CreateSosReqBody {
  rental_id: ObjectId
  requester_id: ObjectId
  bike_id: ObjectId
}

export type ConfirmSosReqBody = {
  solvable: boolean;
  agent_notes: string;
  photos: string[]
}

export type RejectSosReqBody = {
  agent_notes: string;
  photos: string[]
}

export type SosParam = {
  id: string
}

