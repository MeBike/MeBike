export type CreateRatingReqBody = {
  rating: number
  reason_ids: string[]
  comment?: string
}

export type GetRatingReqQuery = {
  user_id?: string
  rating?: number
  limit?: string
  page?: string
  reason_ids?: string[]
}
