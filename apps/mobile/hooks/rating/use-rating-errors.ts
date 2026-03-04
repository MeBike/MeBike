import type { RatingError } from "@services/ratings";

import { ratingErrorMessage } from "@services/ratings";

export function getRatingErrorCode(error: RatingError): string | null {
  if (error._tag === "ApiError") {
    return error.code;
  }
  return null;
}

export function getRatingErrorMessage(error: RatingError, fallback: string): string {
  const message = ratingErrorMessage(error);
  return message.trim() ? message : fallback;
}
