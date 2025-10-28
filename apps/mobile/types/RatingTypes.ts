export type RatingReason = {
  _id: string;
  type: string;
  applies_to: string;
  messages: string;
};

export type CreateRatingPayload = {
  rating: number;
  reason_ids: string[];
  comment?: string;
};
