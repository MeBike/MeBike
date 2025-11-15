
export type CreateSosReqBody = {
  rental_id: string,
  issue: string,
  latitude: number,
  longitude: number
}

export type ResolveSosReqBody = {
  solvable: boolean;
  agent_notes: string;
  photos: string[]
}

export type RejectSosReqBody = {
  agent_notes: string;
  photos: string[]
}

export type CancelSosReqBody = {
  reason: string;
}

export type SosParam = {
  id: string
}


export type AssignSosReqBody = {
  sos_agent_id: string;
  replaced_bike_id: string
}

