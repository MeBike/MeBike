export type RatingReason = {
  _id: string;
  type: string;
  applies_to: string;
  messages: string;
};

export type RatingDetail = {
  _id: string;
  user_id: string;
  rental_id: string;
  rating: number;
  reason_ids: string[];
  comment?: string;
  created_at: string;
  updated_at: string;
  reason_details: RatingReason[];
};

export type CreateRatingPayload = {
  rating: number;
  reason_ids: string[];
  comment?: string;
};
